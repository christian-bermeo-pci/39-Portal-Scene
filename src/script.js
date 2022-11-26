import './style.css';
import * as dat from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import firefliesVertexShader from './shaders/fireflies/vertex.glsl';
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl';
import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';

/**
 * Base
 */

const debugObject = {};
// Debug
const gui = new dat.GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/');

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Objects
 */

/**
 * Blender Jpeg bake to Texture
 */
const bakedTexture = textureLoader.load(`ChrisPortal/bake.jpg`);
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

// Wood texture to fix light poles
const woodTexture = textureLoader.load(`ChrisPortal/wood-texture.jpeg`);
woodTexture.flipY = false;
woodTexture.encoding = THREE.sRGBEncoding;

/**
 * Materials
 */
debugObject.portalColor1 = '#ca57f4';
debugObject.portalColor2 = '#280042';
debugObject.firefliesColor = '#ee99ff';

// Fixing my materials
const FixWoodPoleMaterial = new THREE.MeshBasicMaterial({
  color: 0x241413,
  map: woodTexture,
  side: THREE.DoubleSide,
});
const FixLightMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000,
  side: THREE.DoubleSide,
});

// Baked Material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
  side: THREE.DoubleSide,
});

// Pole Light Material
const poleLightMaterial = new THREE.MeshBasicMaterial({
  color: debugObject.firefliesColor,
});

gui
  .addColor(debugObject, 'portalColor1')
  .onChange(() => {
    portalLightMaterial.uniforms.uColorStart.value.set(
      debugObject.portalColor1
    );
  })
  .name('Portal Color 1:');
gui
  .addColor(debugObject, 'portalColor2')
  .onChange(() => {
    portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColor2);
  })
  .name('Portal Color 2:');

// Portal Light Material
const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColor1) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColor2) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

/**
 * Model from Blender
 */
gltfLoader.load(`ChrisPortal/portal.glb`, (gltf) => {
  // Fixing wrong orientation
  gltf.scene.rotateY(Math.PI);
  gltf.scene.traverse((child) => {
    child.material = bakedMaterial;
  });

  /**
   * Targeting specific meshes with the .find method on the children array
   */

  // This are the meshes that we need to fix on our bake we could have named them better on blender too lol
  const post1 = gltf.scene.children.find((child) => child.name === 'Cube028');
  const post2 = gltf.scene.children.find((child) => child.name === 'Cube007');
  const lamp1 = gltf.scene.children.find((child) => child.name === 'Cube029');
  const lamp2 = gltf.scene.children.find((child) => child.name === 'Cube008');

  post1.material = FixWoodPoleMaterial;
  post2.material = FixWoodPoleMaterial;
  lamp1.material = FixLightMaterial;
  lamp2.material = FixLightMaterial;

  // Emissions and lights.
  const portalLight = gltf.scene.children.find(
    (child) => child.name === 'Circle'
  );
  const lampLight1 = gltf.scene.children.find(
    (child) => child.name === 'Cube009'
  );
  const lampLight2 = gltf.scene.children.find(
    (child) => child.name === 'Cube030'
  );

  portalLight.material = portalLightMaterial;
  lampLight1.material = poleLightMaterial;
  lampLight2.material = poleLightMaterial;

  scene.add(gltf.scene);
});

/**
 * FIREFLIES PARTICLES
 */

/**
 *  Geometry.
 */
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 50;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

// Random positions and scale
for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionArray, 3)
);

firefliesGeometry.setAttribute(
  'aScale',
  new THREE.BufferAttribute(scaleArray, 1)
);

/**
 * Material
 */

gui
  .addColor(debugObject, 'firefliesColor')
  .onChange(() => {
    firefliesMaterial.uniforms.uColor.value.set(debugObject.firefliesColor);
    poleLightMaterial.color.set(debugObject.firefliesColor);
  })
  .name('Fireflies Color:');

const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 250 },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(debugObject.firefliesColor) },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending, // Making fireflies shine effect
  depthWrite: false, // stop them from hiding stuff in the back (transparent).
});

gui
  .add(firefliesMaterial.uniforms.uSize, 'value')
  .min(0)
  .max(500)
  .step(1)
  .name('Firefly size:');

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;

debugObject.clearColor = '#0e0707';
renderer.setClearColor(debugObject.clearColor);
gui
  .addColor(debugObject, 'clearColor')
  .onChange(() => {
    renderer.setClearColor(debugObject.clearColor);
  })
  .name('Background Color:');

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Updating uTime uniform
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalLightMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
