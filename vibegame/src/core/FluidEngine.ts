import { FLUID_SETTINGS } from "../config";
import type { FluidEngineContract, HandPoint, QualityPreset } from "../types";
import { clamp } from "../utils/math";
import {
  advectionShader,
  baseVertexShader,
  clearShader,
  curlShader,
  displayShader,
  divergenceShader,
  gradientSubtractShader,
  pressureShader,
  splatShader,
  vorticityShader,
} from "./FluidShaders";

interface FBO {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

interface ProgramInfo {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export class FluidEngine implements FluidEngineContract {
  private readonly canvas: HTMLCanvasElement;
  private readonly maxPixelRatio: number;
  private gl: WebGL2RenderingContext | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private initialized = false;
  private displayWidth = 1;
  private displayHeight = 1;

  private preset: QualityPreset;

  private programs: Record<string, ProgramInfo> = {};

  private velocity: DoubleFBO | null = null;
  private density: DoubleFBO | null = null;
  private pressure: DoubleFBO | null = null;
  private divergence: FBO | null = null;
  private curl: FBO | null = null;

  constructor(preset: QualityPreset) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 2;
    this.canvas.height = 2;
    this.preset = preset;
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    this.maxPixelRatio = isMobile ? 1 : 1.2;
  }

  init(): void {
    if (this.initialized) {
      return;
    }

    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      throw new Error("Unable to initialize WebGL2 for fluid simulation.");
    }

    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("EXT_color_buffer_float is required for fluid simulation.");
    }

    this.gl = gl;
    this.initQuad();
    this.initPrograms();
    this.allocateFramebuffers();
    this.initialized = true;
  }

  resize(width: number, height: number): void {
    this.displayWidth = Math.max(1, Math.floor(width));
    this.displayHeight = Math.max(1, Math.floor(height));

    const ratio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    this.canvas.width = Math.max(2, Math.floor(this.displayWidth * ratio));
    this.canvas.height = Math.max(2, Math.floor(this.displayHeight * ratio));

    if (this.initialized) {
      this.allocateFramebuffers();
    }
  }

  setPreset(preset: QualityPreset): void {
    this.preset = preset;
    if (this.initialized) {
      this.allocateFramebuffers();
    }
  }

  step(dt: number): void {
    if (!this.initialized || !this.gl || !this.velocity || !this.density || !this.pressure || !this.divergence || !this.curl) {
      return;
    }

    const delta = clamp(dt, 0.001, 0.033);

    this.applyAdvection(this.velocity, this.velocity.read, FLUID_SETTINGS.velocityDissipation, delta);
    this.applyAdvection(this.density, this.density.read, FLUID_SETTINGS.densityDissipation, delta);

    this.computeCurl();
    this.applyVorticity(delta);

    this.computeDivergence();
    this.solvePressure();
    this.subtractPressureGradient();

    this.renderDensityToDisplay();
  }

  splat(points: HandPoint[]): void {
    if (!this.initialized || !this.gl || !this.velocity || !this.density) {
      return;
    }

    const velocity = this.velocity;
    const density = this.density;

    const activePoints = points.filter((point) => point.confidence > 0.2);
    if (activePoints.length === 0) {
      return;
    }

    for (const point of activePoints) {
      const forceX = point.vxNorm * FLUID_SETTINGS.splatForce;
      const forceY = point.vyNorm * FLUID_SETTINGS.splatForce;
      const color = this.colorFromId(point.id, Math.hypot(forceX, forceY));

      this.drawToFbo("splat", velocity.write, (program) => {
        this.bindTexture(program.uniforms.uTarget, velocity.read.texture, 0);
        this.setUniform2f(program.uniforms.uPoint, point.xNorm, 1 - point.yNorm);
        this.setUniform1f(program.uniforms.uRadius, FLUID_SETTINGS.splatRadius);
        this.setUniform3f(program.uniforms.uColor, forceX, -forceY, 0);
        this.setUniform2f(program.uniforms.uAspect, this.displayWidth, this.displayHeight);
      });
      velocity.swap();

      this.drawToFbo("splat", density.write, (program) => {
        this.bindTexture(program.uniforms.uTarget, density.read.texture, 0);
        this.setUniform2f(program.uniforms.uPoint, point.xNorm, 1 - point.yNorm);
        this.setUniform1f(program.uniforms.uRadius, FLUID_SETTINGS.splatRadius * 0.6);
        this.setUniform3f(program.uniforms.uColor, color[0], color[1], color[2]);
        this.setUniform2f(program.uniforms.uAspect, this.displayWidth, this.displayHeight);
      });
      density.swap();
    }
  }

  getDensityTexture(): WebGLTexture | null {
    return this.density?.read.texture ?? null;
  }

  getDisplayCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  reset(): void {
    if (!this.initialized) {
      return;
    }

    this.allocateFramebuffers();
  }

  dispose(): void {
    if (!this.gl) {
      return;
    }

    this.deleteTargets();

    for (const program of Object.values(this.programs)) {
      this.gl.deleteProgram(program.program);
    }

    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
      this.vao = null;
    }

    this.programs = {};
    this.initialized = false;
    this.gl = null;
  }

  private initQuad(): void {
    if (!this.gl) {
      return;
    }

    const gl = this.gl;
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      throw new Error("Unable to create vertex buffer.");
    }

    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("Unable to create vertex array.");
    }

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.vao = vao;
  }

  private initPrograms(): void {
    this.programs = {
      clear: this.createProgram(clearShader, ["uTexture", "uValue"]),
      splat: this.createProgram(splatShader, ["uTarget", "uPoint", "uRadius", "uColor", "uAspect"]),
      advection: this.createProgram(advectionShader, ["uVelocity", "uSource", "uTexelSize", "uDt", "uDissipation"]),
      divergence: this.createProgram(divergenceShader, ["uVelocity", "uTexelSize"]),
      curl: this.createProgram(curlShader, ["uVelocity", "uTexelSize"]),
      vorticity: this.createProgram(vorticityShader, ["uVelocity", "uCurl", "uTexelSize", "uDt", "uCurlStrength"]),
      pressure: this.createProgram(pressureShader, ["uPressure", "uDivergence", "uTexelSize"]),
      gradientSubtract: this.createProgram(gradientSubtractShader, ["uPressure", "uVelocity", "uTexelSize"]),
      display: this.createProgram(displayShader, ["uTexture"]),
    };
  }

  private createProgram(fragmentShader: string, uniformNames: string[]): ProgramInfo {
    if (!this.gl) {
      throw new Error("WebGL context not initialized.");
    }

    const gl = this.gl;

    const vertex = this.compileShader(gl.VERTEX_SHADER, baseVertexShader);
    const fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentShader);

    const program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to create shader program.");
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) ?? "unknown";
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      throw new Error(`Failed to link shader program: ${info}`);
    }

    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of uniformNames) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    return { program, uniforms };
  }

  private compileShader(type: number, source: string): WebGLShader {
    if (!this.gl) {
      throw new Error("WebGL context not initialized.");
    }

    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Unable to create shader.");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) ?? "unknown";
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${info}`);
    }

    return shader;
  }

  private allocateFramebuffers(): void {
    if (!this.gl) {
      return;
    }

    this.deleteTargets();

    const gl = this.gl;
    const sim = this.computeResolution(this.preset.simResolution);
    const dye = this.computeResolution(this.preset.dyeResolution);

    this.velocity = this.createDoubleFBO(sim.width, sim.height, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
    this.density = this.createDoubleFBO(dye.width, dye.height, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    this.pressure = this.createDoubleFBO(sim.width, sim.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);

    this.divergence = this.createFBO(sim.width, sim.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
    this.curl = this.createFBO(sim.width, sim.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
  }

  private computeResolution(base: number): { width: number; height: number } {
    const aspect = this.canvas.width / this.canvas.height;
    if (!Number.isFinite(aspect) || aspect <= 0) {
      return { width: base, height: base };
    }

    if (aspect > 1) {
      return {
        width: Math.max(2, Math.round(base * aspect)),
        height: Math.max(2, base),
      };
    }

    return {
      width: Math.max(2, base),
      height: Math.max(2, Math.round(base / aspect)),
    };
  }

  private createFBO(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    filter: number,
  ): FBO {
    if (!this.gl) {
      throw new Error("WebGL context not initialized.");
    }

    const gl = this.gl;

    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();

    if (!texture || !framebuffer) {
      throw new Error("Unable to create fluid framebuffer resources.");
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Fluid framebuffer incomplete: ${status}`);
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { texture, framebuffer, width, height };
  }

  private createDoubleFBO(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    filter: number,
  ): DoubleFBO {
    const first = this.createFBO(width, height, internalFormat, format, type, filter);
    const second = this.createFBO(width, height, internalFormat, format, type, filter);

    return {
      read: first,
      write: second,
      swap: () => {
        const texture = first.texture;
        const framebuffer = first.framebuffer;
        const widthState = first.width;
        const heightState = first.height;

        first.texture = second.texture;
        first.framebuffer = second.framebuffer;
        first.width = second.width;
        first.height = second.height;

        second.texture = texture;
        second.framebuffer = framebuffer;
        second.width = widthState;
        second.height = heightState;
      },
    };
  }

  private drawToFbo(name: string, target: FBO | null, setup: (program: ProgramInfo) => void): void {
    if (!this.gl || !this.vao) {
      return;
    }

    const gl = this.gl;
    const program = this.programs[name];

    gl.useProgram(program.program);
    gl.bindVertexArray(this.vao);

    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    setup(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(null);
  }

  private applyAdvection(target: DoubleFBO, source: FBO, dissipation: number, dt: number): void {
    this.drawToFbo("advection", target.write, (program) => {
      this.bindTexture(program.uniforms.uVelocity, this.velocity!.read.texture, 0);
      this.bindTexture(program.uniforms.uSource, source.texture, 1);
      this.setUniform2f(program.uniforms.uTexelSize, 1 / target.read.width, 1 / target.read.height);
      this.setUniform1f(program.uniforms.uDt, dt);
      this.setUniform1f(program.uniforms.uDissipation, dissipation);
    });

    target.swap();
  }

  private computeCurl(): void {
    if (!this.velocity || !this.curl) {
      return;
    }

    this.drawToFbo("curl", this.curl, (program) => {
      this.bindTexture(program.uniforms.uVelocity, this.velocity!.read.texture, 0);
      this.setUniform2f(program.uniforms.uTexelSize, 1 / this.velocity!.read.width, 1 / this.velocity!.read.height);
    });
  }

  private applyVorticity(dt: number): void {
    if (!this.velocity || !this.curl) {
      return;
    }

    this.drawToFbo("vorticity", this.velocity.write, (program) => {
      this.bindTexture(program.uniforms.uVelocity, this.velocity!.read.texture, 0);
      this.bindTexture(program.uniforms.uCurl, this.curl!.texture, 1);
      this.setUniform2f(program.uniforms.uTexelSize, 1 / this.velocity!.read.width, 1 / this.velocity!.read.height);
      this.setUniform1f(program.uniforms.uDt, dt);
      this.setUniform1f(program.uniforms.uCurlStrength, FLUID_SETTINGS.curlStrength);
    });

    this.velocity.swap();
  }

  private computeDivergence(): void {
    if (!this.velocity || !this.divergence) {
      return;
    }

    this.drawToFbo("divergence", this.divergence, (program) => {
      this.bindTexture(program.uniforms.uVelocity, this.velocity!.read.texture, 0);
      this.setUniform2f(program.uniforms.uTexelSize, 1 / this.velocity!.read.width, 1 / this.velocity!.read.height);
    });
  }

  private solvePressure(): void {
    if (!this.pressure || !this.divergence) {
      return;
    }

    this.drawToFbo("clear", this.pressure.write, (program) => {
      this.bindTexture(program.uniforms.uTexture, this.pressure!.read.texture, 0);
      this.setUniform1f(program.uniforms.uValue, 0.8);
    });
    this.pressure.swap();

    for (let i = 0; i < this.preset.pressureIterations; i += 1) {
      this.drawToFbo("pressure", this.pressure.write, (program) => {
        this.bindTexture(program.uniforms.uPressure, this.pressure!.read.texture, 0);
        this.bindTexture(program.uniforms.uDivergence, this.divergence!.texture, 1);
        this.setUniform2f(program.uniforms.uTexelSize, 1 / this.pressure!.read.width, 1 / this.pressure!.read.height);
      });
      this.pressure.swap();
    }
  }

  private subtractPressureGradient(): void {
    if (!this.velocity || !this.pressure) {
      return;
    }

    this.drawToFbo("gradientSubtract", this.velocity.write, (program) => {
      this.bindTexture(program.uniforms.uPressure, this.pressure!.read.texture, 0);
      this.bindTexture(program.uniforms.uVelocity, this.velocity!.read.texture, 1);
      this.setUniform2f(program.uniforms.uTexelSize, 1 / this.velocity!.read.width, 1 / this.velocity!.read.height);
    });

    this.velocity.swap();
  }

  private renderDensityToDisplay(): void {
    if (!this.density) {
      return;
    }

    this.drawToFbo("display", null, (program) => {
      this.bindTexture(program.uniforms.uTexture, this.density!.read.texture, 0);
    });
  }

  private bindTexture(location: WebGLUniformLocation | null, texture: WebGLTexture, unit: number): void {
    if (!this.gl) {
      return;
    }

    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (location) {
      gl.uniform1i(location, unit);
    }
  }

  private setUniform1f(location: WebGLUniformLocation | null, x: number): void {
    if (!this.gl || !location) {
      return;
    }

    this.gl.uniform1f(location, x);
  }

  private setUniform2f(location: WebGLUniformLocation | null, x: number, y: number): void {
    if (!this.gl || !location) {
      return;
    }

    this.gl.uniform2f(location, x, y);
  }

  private setUniform3f(location: WebGLUniformLocation | null, x: number, y: number, z: number): void {
    if (!this.gl || !location) {
      return;
    }

    this.gl.uniform3f(location, x, y, z);
  }

  private deleteTargets(): void {
    if (!this.gl) {
      return;
    }

    const gl = this.gl;

    const deleteFbo = (target: FBO | null): void => {
      if (!target) {
        return;
      }
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.framebuffer);
    };

    const deleteDouble = (target: DoubleFBO | null): void => {
      if (!target) {
        return;
      }
      deleteFbo(target.read);
      deleteFbo(target.write);
    };

    deleteDouble(this.velocity);
    deleteDouble(this.density);
    deleteDouble(this.pressure);
    deleteFbo(this.divergence);
    deleteFbo(this.curl);

    this.velocity = null;
    this.density = null;
    this.pressure = null;
    this.divergence = null;
    this.curl = null;
  }

  private colorFromId(id: string, intensity: number): [number, number, number] {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }

    const hue = Math.abs(hash % 360) / 360;
    const saturation = 0.85;
    const lightness = 0.62;
    const rgb = hslToRgb(hue, saturation, lightness);

    const gain = clamp(0.6 + intensity * 0.12, 0.6, 1.4);
    return [rgb[0] * gain, rgb[1] * gain, rgb[2] * gain];
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    return [l, l, l];
  }

  const hueToRgb = (p: number, q: number, t: number): number => {
    let localT = t;
    if (localT < 0) {
      localT += 1;
    }
    if (localT > 1) {
      localT -= 1;
    }
    if (localT < 1 / 6) {
      return p + (q - p) * 6 * localT;
    }
    if (localT < 1 / 2) {
      return q;
    }
    if (localT < 2 / 3) {
      return p + (q - p) * (2 / 3 - localT) * 6;
    }
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hueToRgb(p, q, h + 1 / 3);
  const g = hueToRgb(p, q, h);
  const b = hueToRgb(p, q, h - 1 / 3);

  return [r, g, b];
}
