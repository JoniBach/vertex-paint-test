import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("threeCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 10;
controls.update();

// Load GLTF model
const loader = new GLTFLoader();
let spaceshipMesh;
const noseIndices = [];
const wingIndices = [];
const engineIndices = [];

loader.load("fighter.gltf", (gltf) => {
  spaceshipMesh = gltf.scene.children[0];
  scene.add(spaceshipMesh);

  const geometry = spaceshipMesh.geometry;
  const colors = geometry.attributes.color;

  if (!colors) {
    console.error("No vertex colors found on the model.");
    return;
  }

  for (let i = 0; i < colors.count; i++) {
    const r = colors.getX(i);
    const g = colors.getY(i);
    const b = colors.getZ(i);

    if (r === 1 && g === 0 && b === 0) {
      wingIndices.push(i);
    } else if (r === 0 && g === 1 && b === 0) {
      engineIndices.push(i);
    } else if (r === 0 && g === 0 && b === 1) {
      noseIndices.push(i);
    }
  }

  console.log("Nose Indices:", noseIndices);
  console.log("Wing Indices:", wingIndices);
  console.log("Engine Indices:", engineIndices);
});

// Sliders
const noseSlider = document.getElementById("noseSlider");
const wingSlider = document.getElementById("wingSlider");
const engineSlider = document.getElementById("engineSlider");

noseSlider.addEventListener("input", (event) => {
  console.log("Nose Slider Value:", event.target.value);
  adjustVertices(noseIndices, "z", parseFloat(event.target.value));
});

wingSlider.addEventListener("input", (event) => {
  console.log("Wing Slider Value:", event.target.value);
  adjustVertices(wingIndices, "x", parseFloat(event.target.value));
});

engineSlider.addEventListener("input", (event) => {
  console.log("Engine Slider Value:", event.target.value);
  adjustVertices(engineIndices, "z", parseFloat(event.target.value));
});

function adjustVertices(indices, axis, value) {
  if (!spaceshipMesh) return;

  const geometry = spaceshipMesh.geometry;
  const position = geometry.attributes.position;

  indices.forEach((index) => {
    const current = position[`get${axis.toUpperCase()}`](index);
    position[`set${axis.toUpperCase()}`](index, current + value);
  });

  position.needsUpdate = true; // Notify Three.js of the changes
}

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Render loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
