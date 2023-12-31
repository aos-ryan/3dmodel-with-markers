import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: '#444444',
    metalness: 0,
    roughness: 0.5
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);
/**
 * Points
 */
const points = [
  {
    position: new THREE.Vector3(1.55, 0.3, 0.76),
    element: document.querySelector('.point-0')
  },
  {
    position: new THREE.Vector3(1.55, 0.6, 0.76),
    element: document.querySelector('.point-1')
  }
];
/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Models
 */
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/models/Boulder/boulder.glb',
  (glb) => {
    const boulderScene = glb.scene;
    boulderScene.scale.set(0.01, 0.01, 0.01);
    boulderScene.position.y = 1;
    scene.add(boulderScene);
  }
  //   (progress) => {
  //     console.log("progress");
  //     console.log(progress);
  //   },
  //   (error) => {
  //     console.log("error");
  //     console.log(error);
  //   }
);
// console.log(scene);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
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
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(2, 2, 2);
scene.add(camera);
console.log(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;
/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update controls
  controls.update();
  // Go through each point
  for (const point of points) {
    // clone the position of the point
    const screenPosition = point.position.clone();
    // get the 2D screen position of the 3D scene position of the point
    screenPosition.project(camera);
    // update raycaster to go from the camera to the point
    raycaster.setFromCamera(screenPosition, camera);
    // ensure point is tied correctly to its 3D position
    const translateX = screenPosition.x * sizes.width * 0.5;
    const translateY = -screenPosition.y * sizes.height * 0.5;
    point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
    // test raycaster against all the objects in the scene, "true" parameter enables recursive testing
    const intersects = raycaster.intersectObjects(scene.children, true);
    // check intersects array, if array is empty then the point should be visible
    if (intersects.length === 0) {
      point.element.classList.add('visible');
    } else {
      // intersection could be behind the point, calculate the distance to the point, then calculate the intersections distance and compare
      const intersectionDistance = intersects[0].distance;
      const pointDistance = point.position.distanceTo(camera.position);
      // if the intersectionDistance is less than the point distance i.e. the point is further away from the camera, it should not be visible
      if (intersectionDistance < pointDistance) {
        point.element.classList.remove('visible');
      } else {
        point.element.classList.add('visible');
      }
    }
  }
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
