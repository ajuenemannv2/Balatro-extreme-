import Phaser from 'phaser';

const fragShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 texColor = texture2D(uMainSampler, outTexCoord);
  if (texColor.a < 0.1) { gl_FragColor = texColor; return; }
  float hue = fract(outTexCoord.x * 2.0 + uTime * 0.5);
  vec3 rainbow = hsv2rgb(vec3(hue, 0.85, 1.0));
  gl_FragColor = vec4(mix(texColor.rgb, rainbow, 0.35), texColor.a);
}
`;

export class FoilPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private _time = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: 'FoilPipeline', fragShader });
  }

  onPreRender(): void {
    this._time += 0.016;
    this.set1f('uTime', this._time);
  }
}
