import * as THREE from "three";

import "./styles.css";

import { DEFAULT_CONFIG } from "./config";
import { AdaptiveQuality } from "./core/AdaptiveQuality";
import { Compositor } from "./core/Compositor";
import { FluidEngine } from "./core/FluidEngine";
import { RhythmDirector } from "./core/RhythmDirector";
import { VisionPipeline } from "./core/VisionPipeline";
import type { AppConfig, HandPoint, QualityMode } from "./types";
import { Controls } from "./ui/Controls";
import { Overlay } from "./ui/Overlay";
import { ensureWebGL2, getCameraErrorMessage, isMobileDevice } from "./utils/browser";
import { clamp, clampVelocity, formatFps, mapHandPointForMirror } from "./utils/math";

interface PointerState {
  active: boolean;
  xNorm: number;
  yNorm: number;
  vxNorm: number;
  vyNorm: number;
  updatedAtMs: number;
}

const appRoot = document.getElementById("app");
if (!appRoot) {
  throw new Error("Missing #app root element.");
}

const shell = document.createElement("div");
shell.className = "game-shell";

const stageCanvas = document.createElement("canvas");
stageCanvas.className = "game-canvas";
shell.append(stageCanvas);

const webcamVideo = document.createElement("video");
webcamVideo.playsInline = true;
webcamVideo.autoplay = true;
webcamVideo.muted = true;
webcamVideo.style.position = "fixed";
webcamVideo.style.left = "-10000px";
webcamVideo.style.top = "0";
webcamVideo.style.width = "1px";
webcamVideo.style.height = "1px";
webcamVideo.style.opacity = "0";
webcamVideo.style.pointerEvents = "none";

appRoot.append(shell, webcamVideo);

const config: AppConfig = { ...DEFAULT_CONFIG };

const adaptiveQuality = new AdaptiveQuality(isMobileDevice());
let activePreset = adaptiveQuality.getPreset(config.quality);

const fluidEngine = new FluidEngine(activePreset);
const visionPipeline = new VisionPipeline(activePreset);
const compositor = new Compositor();
const rhythmDirector = new RhythmDirector(114);

const overlay = new Overlay(shell);
const controls = new Controls(shell, {
  onMirrorChange: (value) => {
    config.mirror = value;
  },
  onQualityChange: (value) => {
    setQualityMode(value);
  },
  onReset: () => {
    fluidEngine.reset();
  },
  onDebugChange: (value) => {
    config.showDebug = value;
  },
});
controls.setVisible(false);
controls.setQuality(config.quality);

let stream: MediaStream | null = null;
let videoTexture: THREE.VideoTexture | null = null;
let fluidTexture: THREE.CanvasTexture | null = null;

let running = false;
let startupInFlight = false;
let visionBooting = false;
let visionReady = false;
let animationFrame = 0;
let lastFrameMs = 0;
let smoothFrameMs = 16.7;
let visionStatus = "Vision: loading";

const pointer: PointerState = {
  active: false,
  xNorm: 0.5,
  yNorm: 0.5,
  vxNorm: 0,
  vyNorm: 0,
  updatedAtMs: 0,
};

overlay.setReady("Click Start, allow camera access, and make mesmerizing fluid trails with your motion.");
overlay.onStart(() => {
  void startGame();
});

window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", () => {
  window.setTimeout(handleResize, 120);
});
window.addEventListener("beforeunload", teardown);

stageCanvas.addEventListener("pointerdown", onPointerUpdate);
stageCanvas.addEventListener("pointermove", onPointerUpdate);
window.addEventListener("pointerup", clearPointer);
window.addEventListener("pointercancel", clearPointer);

async function startGame(): Promise<void> {
  if (running || startupInFlight) {
    return;
  }

  startupInFlight = true;

  try {
    ensureWebGL2();

    overlay.setLoading("Requesting camera access...");
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    webcamVideo.srcObject = stream;
    await waitForVideoReady(webcamVideo);

    activePreset = adaptiveQuality.getPreset(config.quality);

    fluidEngine.init();
    fluidEngine.setPreset(activePreset);
    fluidEngine.resize(window.innerWidth, window.innerHeight);

    overlay.setLoading("Starting renderer...");
    compositor.init(stageCanvas);
    compositor.resize(window.innerWidth, window.innerHeight);

    videoTexture = new THREE.VideoTexture(webcamVideo);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.wrapS = THREE.ClampToEdgeWrapping;
    videoTexture.wrapT = THREE.ClampToEdgeWrapping;
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    fluidTexture = new THREE.CanvasTexture(fluidEngine.getDisplayCanvas());
    fluidTexture.minFilter = THREE.LinearFilter;
    fluidTexture.magFilter = THREE.LinearFilter;
    fluidTexture.wrapS = THREE.ClampToEdgeWrapping;
    fluidTexture.wrapT = THREE.ClampToEdgeWrapping;
    fluidTexture.colorSpace = THREE.SRGBColorSpace;

    controls.setVisible(true);
    overlay.hide();

    rhythmDirector.reset(performance.now());
    running = true;
    lastFrameMs = performance.now();
    animationFrame = requestAnimationFrame(loop);

    visionStatus = "Vision: loading models";
    void initializeVisionInBackground();
  } catch (error) {
    teardown();
    overlay.setError(formatStartupError(error));
  } finally {
    startupInFlight = false;
  }
}

async function initializeVisionInBackground(): Promise<void> {
  if (visionBooting || visionReady) {
    return;
  }

  visionBooting = true;

  try {
    await withTimeout(visionPipeline.init(webcamVideo), 12000, "Vision model load timed out.");
    visionPipeline.setPreset(activePreset);
    visionReady = true;

    const capabilities: string[] = [];
    if (visionPipeline.hasHandTracking()) {
      capabilities.push("hands");
    }
    visionStatus = capabilities.length > 0 ? `Vision: ${capabilities.join(" + ")} ready` : "Vision: unavailable";
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    visionStatus = `Vision degraded: ${message}`;
  } finally {
    visionBooting = false;
  }
}

function loop(nowMs: number): void {
  if (!running) {
    return;
  }

  if (!videoTexture || !fluidTexture) {
    animationFrame = requestAnimationFrame(loop);
    return;
  }

  try {
    const frameMs = Math.max(1, nowMs - lastFrameMs);
    const dtSeconds = frameMs / 1000;
    lastFrameMs = nowMs;

    smoothFrameMs = smoothFrameMs * 0.9 + frameMs * 0.1;

    const qualityChange = adaptiveQuality.pushFrameTime(frameMs, config.quality, nowMs);
    if (qualityChange.changed && config.quality === "auto") {
      activePreset = adaptiveQuality.getPreset("auto");
      fluidEngine.setPreset(activePreset);
      if (visionReady) {
        visionPipeline.setPreset(activePreset);
      }
    }

    if (visionReady) {
      void visionPipeline.update(nowMs).catch(() => {
        // Vision updates are best-effort to avoid stalling render.
      });
    }

    const handPoints = visionReady ? visionPipeline.getHandPoints() : [];
    const inputPoints = handPoints.length > 0 ? handPoints : getPointerPoints(nowMs);

    const mappedHandPoints = inputPoints
      .map((point) => mapHandPointForMirror(point, config.mirror))
      .sort((a, b) => Math.hypot(b.vxNorm, b.vyNorm) - Math.hypot(a.vxNorm, a.vyNorm))
      .slice(0, 4);

    const leadPoint = mappedHandPoints.length > 0 ? mappedHandPoints[0] : null;
    const rhythmState = rhythmDirector.update(nowMs, leadPoint);
    const allSplatPoints = [...mappedHandPoints, ...rhythmState.splatPoints].slice(0, 8);

    fluidEngine.splat(allSplatPoints);
    fluidEngine.step(dtSeconds);

    if (webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      videoTexture.needsUpdate = true;
    }

    compositor.render({
      fluidTex: fluidTexture,
      videoTex: videoTexture,
      mirror: config.mirror,
      beatPulse: rhythmState.beatPulse,
      colorPhase: rhythmState.colorPhase,
    });

    const activeQualityLevel = adaptiveQuality.getActiveLevel(config.quality);
    const qualityLabel = config.quality === "auto" ? `auto(${activeQualityLevel})` : activeQualityLevel;
    const inputLabel = handPoints.length > 0 ? "hand" : pointer.active ? "pointer" : "idle";
    controls.updateHud(
      `FPS ${formatFps(smoothFrameMs)} | ${qualityLabel} | ${inputLabel} | ${visionStatus} | vibe ${rhythmState.patternLabel} | BPM ${rhythmState.bpm}`,
      config.showDebug,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    visionStatus = `Runtime error: ${message}`;
    // Keep rendering loop alive even if one frame fails.
    console.error(error);
  }

  animationFrame = requestAnimationFrame(loop);
}

function handleResize(): void {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);

  fluidEngine.resize(width, height);
  compositor.resize(width, height);
}

function setQualityMode(mode: QualityMode): void {
  config.quality = mode;

  activePreset = adaptiveQuality.getPreset(config.quality);
  fluidEngine.setPreset(activePreset);
  if (visionReady) {
    visionPipeline.setPreset(activePreset);
  }
}

function teardown(): void {
  running = false;
  startupInFlight = false;
  visionBooting = false;
  visionReady = false;
  visionStatus = "Vision: loading";

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  if (videoTexture) {
    videoTexture.dispose();
    videoTexture = null;
  }

  if (fluidTexture) {
    fluidTexture.dispose();
    fluidTexture = null;
  }

  visionPipeline.dispose();
  fluidEngine.dispose();
  compositor.dispose();

  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    stream = null;
  }

  pointer.active = false;
  pointer.vxNorm = 0;
  pointer.vyNorm = 0;
  pointer.updatedAtMs = 0;

  webcamVideo.srcObject = null;
}

function formatStartupError(error: unknown): string {
  if (error instanceof DOMException) {
    return getCameraErrorMessage(error);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to initialize the playground. Check camera permission, WebGL2 support, and network access.";
}

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      void video.play().then(resolve).catch(reject);
    };

    const onError = () => {
      cleanup();
      reject(new Error("Unable to start webcam stream."));
    };

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      onLoaded();
      return;
    }

    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutHandle = 0;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
    }
  });
}

function onPointerUpdate(event: PointerEvent): void {
  const rect = stageCanvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const xNorm = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const yNorm = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const nowMs = performance.now();

  if (pointer.active) {
    const dtSeconds = Math.max(0.001, (nowMs - pointer.updatedAtMs) / 1000);
    pointer.vxNorm = clampVelocity((xNorm - pointer.xNorm) / dtSeconds, 4);
    pointer.vyNorm = clampVelocity((yNorm - pointer.yNorm) / dtSeconds, 4);
  } else {
    pointer.vxNorm = 0;
    pointer.vyNorm = 0;
  }

  pointer.active = true;
  pointer.xNorm = xNorm;
  pointer.yNorm = yNorm;
  pointer.updatedAtMs = nowMs;
}

function clearPointer(): void {
  pointer.active = false;
  pointer.vxNorm = 0;
  pointer.vyNorm = 0;
}

function getPointerPoints(nowMs: number): HandPoint[] {
  if (!pointer.active || nowMs - pointer.updatedAtMs > 140) {
    return [];
  }

  return [
    {
      id: "pointer-main",
      xNorm: pointer.xNorm,
      yNorm: pointer.yNorm,
      vxNorm: pointer.vxNorm,
      vyNorm: pointer.vyNorm,
      confidence: 1,
    },
  ];
}
