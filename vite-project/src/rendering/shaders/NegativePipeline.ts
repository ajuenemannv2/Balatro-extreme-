import Phaser from 'phaser';

const fragShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  if (c.a < 0.1) { gl_FragColor = c; return; }
  gl_FragColor = vec4(1.0 - c.rgb, c.a);
}
`;

export class NegativePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'NegativePipeline', fragShader });
  }
}
