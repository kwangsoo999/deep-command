import * as T from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
export const looks = {
  cinema: {
    label: "Điện ảnh",
    bloom: 0.23,
    grade: 0.35,
    vignette: 0.22,
    exposure: 1,
    tint: 0x3c8293,
  },
  natural: {
    label: "Tự nhiên",
    bloom: 0,
    grade: 0,
    vignette: 0,
    exposure: 1.05,
    tint: 0x71969e,
  },
  abyss: {
    label: "Biển sâu",
    bloom: 0.12,
    grade: 0.55,
    vignette: 0.3,
    exposure: 0.86,
    tint: 0x245889,
  },
} as const;
export type Look = keyof typeof looks;
export const gradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uGrade: { value: 0.35 },
    uVignette: { value: 0.22 },
  },
  vertexShader:
    "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uGrade; uniform float uVignette; varying vec2 vUv;
void main(){vec4 sampleColor=texture2D(tDiffuse,vUv);vec3 c=sampleColor.rgb;float l=dot(c,vec3(.2126,.7152,.0722));vec3 tint=mix(vec3(.82,1.02,1.08),vec3(1.08,1.03,.93),smoothstep(.08,1.5,l));c=mix(c,c*tint,uGrade);vec2 p=(vUv-.5)*2.0;float edge=smoothstep(.25,1.4,dot(p,p));c*=1.0-edge*uVignette;gl_FragColor=vec4(c,sampleColor.a);}`,
};
export function createCinema(
  renderer: T.WebGLRenderer,
  scene: T.Scene,
  camera: T.Camera,
  high: boolean,
) {
  const baseFog = scene.fog?.color.clone();
  let composer: EffectComposer | undefined,
    bloom: UnrealBloomPass | undefined,
    grade: ShaderPass | undefined,
    output: OutputPass | undefined,
    renderPass: RenderPass | undefined;
  if (high) {
    composer = new EffectComposer(renderer);
    renderPass = new RenderPass(scene, camera);
    bloom = new UnrealBloomPass(new T.Vector2(256, 256), 0.23, 0.35, 0.95);
    grade = new ShaderPass(gradeShader);
    output = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(grade);
    composer.addPass(output);
  }
  return {
    setSize(w: number, h: number) {
      composer?.setSize(w, h);
    },
    render(look: Look, exposure: number) {
      const p = looks[look];
      renderer.toneMappingExposure = exposure * p.exposure;
      if (scene.fog && baseFog)
        scene.fog.color
          .copy(baseFog)
          .lerp(new T.Color(p.tint), look === "natural" ? 0 : 0.12);
      if (bloom) {
        bloom.enabled = p.bloom > 0;
        bloom.strength = p.bloom;
      }
      if (grade) {
        grade.uniforms.uGrade.value = p.grade;
        grade.uniforms.uVignette.value = p.vignette;
      }
      if (composer) composer.render();
      else renderer.render(scene, camera);
    },
    dispose() {
      bloom?.dispose();
      grade?.dispose();
      output?.dispose();
      renderPass?.dispose();
      composer?.dispose();
    },
  };
}
