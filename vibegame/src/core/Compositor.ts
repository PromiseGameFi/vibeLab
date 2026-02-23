import * as THREE from "three";

import type { CompositorContract, CompositorRenderInput } from "../types";

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uFluid;
uniform sampler2D uVideo;
uniform float uMirror;
uniform float uTime;
uniform float uBeatPulse;
uniform float uColorPhase;

vec3 palette(float t) {
  return 0.45 + 0.45 * cos(6.28318 * (vec3(0.08, 0.35, 0.62) + t));
}

void main() {
  vec2 uv = vUv;
  if (uMirror > 0.5) {
    uv.x = 1.0 - uv.x;
  }

  vec3 fluid = texture2D(uFluid, uv).rgb;
  vec3 video = texture2D(uVideo, uv).rgb;
  video = clamp((video - 0.02) * 1.12, 0.0, 1.0);
  vec3 accent = palette(uColorPhase + uTime * 0.02);
  vec3 fluidGlow = fluid * mix(vec3(1.15, 1.02, 1.34), accent * 1.42, 0.45 + 0.35 * uBeatPulse);

  vec3 blend = 1.0 - (1.0 - video) * (1.0 - fluidGlow * (0.65 + 0.1 * uBeatPulse));
  vec3 sceneColor = mix(video, blend, 0.78);
  sceneColor += fluidGlow * (0.2 + 0.24 * uBeatPulse);

  float vignette = smoothstep(1.05, 0.25, length(vUv - 0.5));
  sceneColor *= vignette;

  sceneColor += 0.012 * sin(vec3(0.0, 2.0, 4.0) + uTime * 0.5);
  sceneColor += accent * 0.05 * uBeatPulse;

  gl_FragColor = vec4(sceneColor, 1.0);
}
`;

export class Compositor implements CompositorContract {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;

  private readonly maxPixelRatio: number;

  constructor() {
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    this.maxPixelRatio = isMobile ? 1 : 1.25;
  }

  init(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uFluid: { value: null },
        uVideo: { value: null },
        uMirror: { value: 1 },
        uTime: { value: 0 },
        uBeatPulse: { value: 0 },
        uColorPhase: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(quad);
  }

  render(input: CompositorRenderInput): void {
    if (!this.renderer || !this.scene || !this.camera || !this.material) {
      return;
    }

    this.material.uniforms.uFluid.value = input.fluidTex;
    this.material.uniforms.uVideo.value = input.videoTex;
    this.material.uniforms.uMirror.value = input.mirror ? 1 : 0;
    this.material.uniforms.uTime.value = performance.now() * 0.001;
    this.material.uniforms.uBeatPulse.value = input.beatPulse;
    this.material.uniforms.uColorPhase.value = input.colorPhase;

    if (input.fluidTex instanceof THREE.Texture) {
      input.fluidTex.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    if (!this.renderer) {
      return;
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
    this.renderer.setSize(width, height, false);
  }

  dispose(): void {
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
  }
}
