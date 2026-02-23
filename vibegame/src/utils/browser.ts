export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function ensureWebGL2(): void {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("WebGL2 is required. Use a modern browser with hardware acceleration enabled.");
  }
}

export function getCameraErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "Unable to access the camera. Check browser permissions and HTTPS/localhost.";
  }

  if (error.name === "NotAllowedError") {
    return "Camera permission was denied. Allow camera access and try again.";
  }

  if (error.name === "NotFoundError") {
    return "No camera device was found. Connect a camera and retry.";
  }

  if (error.name === "NotReadableError") {
    return "Camera is already in use by another app. Close that app and retry.";
  }

  return `Camera error: ${error.message || error.name}`;
}
