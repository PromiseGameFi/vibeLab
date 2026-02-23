export const baseVertexShader = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const clearShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;
out vec4 outColor;

void main() {
  outColor = texture(uTexture, vUv) * uValue;
}
`;

export const splatShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform float uRadius;
uniform vec3 uColor;
uniform vec2 uAspect;
out vec4 outColor;

void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect.x / uAspect.y;
  float splat = exp(-dot(p, p) / max(uRadius, 0.000001));
  vec3 base = texture(uTarget, vUv).xyz;
  outColor = vec4(base + uColor * splat, 1.0);
}
`;

export const advectionShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uDissipation;
out vec4 outColor;

void main() {
  vec2 velocity = texture(uVelocity, vUv).xy;
  vec2 coord = clamp(vUv - uDt * velocity * uTexelSize, vec2(0.0), vec2(1.0));
  outColor = uDissipation * texture(uSource, coord);
}
`;

export const divergenceShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
out vec4 outColor;

void main() {
  float left = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
  float right = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
  float bottom = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
  float top = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
  float divergence = 0.5 * ((right - left) + (top - bottom));
  outColor = vec4(divergence, 0.0, 0.0, 1.0);
}
`;

export const curlShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
out vec4 outColor;

void main() {
  float left = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
  float right = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
  float bottom = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
  float top = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
  float vorticity = right - left - top + bottom;
  outColor = vec4(vorticity, 0.0, 0.0, 1.0);
}
`;

export const vorticityShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uCurlStrength;
out vec4 outColor;

void main() {
  float left = abs(texture(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x);
  float right = abs(texture(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x);
  float bottom = abs(texture(uCurl, vUv - vec2(0.0, uTexelSize.y)).x);
  float top = abs(texture(uCurl, vUv + vec2(0.0, uTexelSize.y)).x);

  vec2 force = 0.5 * vec2(top - bottom, right - left);
  force /= length(force) + 0.0001;

  float curl = texture(uCurl, vUv).x;
  force *= uCurlStrength * curl;

  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * uDt;

  outColor = vec4(velocity, 0.0, 1.0);
}
`;

export const pressureShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexelSize;
out vec4 outColor;

void main() {
  float left = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float right = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float bottom = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float top = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  float divergence = texture(uDivergence, vUv).x;

  float pressure = (left + right + bottom + top - divergence) * 0.25;
  outColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

export const gradientSubtractShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
out vec4 outColor;

void main() {
  float left = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float right = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float bottom = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float top = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;

  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= 0.5 * vec2(right - left, top - bottom);
  outColor = vec4(velocity, 0.0, 1.0);
}
`;

export const displayShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
out vec4 outColor;

void main() {
  vec3 color = texture(uTexture, vUv).rgb;
  color = pow(max(color, vec3(0.0)), vec3(0.95));
  outColor = vec4(color, 1.0);
}
`;
