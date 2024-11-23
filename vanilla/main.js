import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Configuration Object
const config = {
  canvasId: "threeCanvas",
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    initialPosition: { x: 0, y: 0, z: 10 },
  },
  lights: {
    ambient: { color: 0xffffff, intensity: 0.5 },
    directional: {
      color: 0xffffff,
      intensity: 0.5,
      position: { x: 5, y: 5, z: 5 },
    },
  },
  sliders: {
    nose: "noseSlider",
    wing: "wingSlider",
    enginePoint: "engineSlider",
    wingSpread: "wingSpreadSlider",
    centerEngine: "centerEngineSlider",
    engines: "enginesSlider",
    engineSpread: "engineSpreadSlider", // New slider for engine spread
  },
};

// Scene Initialization
const initializeScene = (canvasId, cameraConfig) => {
  const canvas = document.getElementById(canvasId);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    cameraConfig.fov,
    window.innerWidth / window.innerHeight,
    cameraConfig.near,
    cameraConfig.far
  );
  camera.position.set(
    cameraConfig.initialPosition.x,
    cameraConfig.initialPosition.y,
    cameraConfig.initialPosition.z
  );
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  return { scene, camera, renderer, controls };
};

// Add Lights to Scene
const addLights = (scene, lightConfig) => {
  const ambientLight = new THREE.AmbientLight(
    lightConfig.ambient.color,
    lightConfig.ambient.intensity
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    lightConfig.directional.color,
    lightConfig.directional.intensity
  );
  directionalLight.position.set(
    lightConfig.directional.position.x,
    lightConfig.directional.position.y,
    lightConfig.directional.position.z
  );
  scene.add(directionalLight);
};

// Load GLTF Model and Extract Vertices
const loadGLTFModel = (url, onLoadCallback) => {
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    onLoadCallback(gltf);
  });
};

// Get Vertices within a Sphere
const getVerticesInSphere = (group, worldCenter, radius) => {
  const nearVertices = [];

  group.traverse((child) => {
    if (child.isMesh && child.geometry && child.geometry.attributes.position) {
      const geometry = child.geometry;
      const position = geometry.attributes.position;

      for (let i = 0; i < position.count; i++) {
        const vertexPosition = new THREE.Vector3(
          position.getX(i),
          position.getY(i),
          position.getZ(i)
        );
        vertexPosition.applyMatrix4(child.matrixWorld);

        if (vertexPosition.distanceTo(worldCenter) <= radius) {
          nearVertices.push({
            mesh: child,
            index: i,
          });
        }
      }
    }
  });

  return nearVertices;
};

// Adjust Vertices by Axis
const adjustVertices = (meshGroup, vertices, axis, delta) => {
  vertices.forEach(({ mesh, index }) => {
    const position = mesh.geometry.attributes.position;
    const current = position[`get${axis.toUpperCase()}`](index);
    position[`set${axis.toUpperCase()}`](index, current + delta);
    position.needsUpdate = true;
  });
};

// Initialize Sliders
const initializeSliders = (sliders, callbacks) => {
  Object.entries(sliders).forEach(([key, sliderId]) => {
    const slider = document.getElementById(sliderId);
    slider.addEventListener("input", (event) => {
      callbacks[key](parseFloat(event.target.value));
    });
  });
};

// Main Execution
const { scene, camera, renderer, controls } = initializeScene(
  config.canvasId,
  config.camera
);
addLights(scene, config.lights);

let spaceshipMesh;
let vertexGroups = {
  nose: [],
  leftWing: [],
  rightWing: [],
  leftEnginePoint: [],
  rightEnginePoint: [],
  leftEngine: [],
  rightEngine: [],
  centerEngine: [],
  centerEngineThruster: [],
};
let sliderPrevValues = {
  nose: 0,
  wing: 0,
  enginePoint: 0,
  wingSpread: 0,
  leftEngine: 0,
  rightEngine: 0,
  centerEngine: 0,
  centerEngineThruster: 0,
  engines: 0,
  engineSpread: 0,
};

loadGLTFModel("fighter.gltf", (gltf) => {
  spaceshipMesh = gltf.scene.getObjectByName("Shuttle");
  console.log(spaceshipMesh);
  const empties = {
    nose: gltf.scene.getObjectByName("center_engine_point"),
    leftEnginePoint: gltf.scene.getObjectByName("left_engine_point"),
    rightEnginePoint: gltf.scene.getObjectByName("right_engine_point"),
    rightWing: gltf.scene.getObjectByName("right_wing"),
    leftWing: gltf.scene.getObjectByName("left_wing"),
    leftEngineBody: gltf.scene.getObjectByName("left_engine_body"),
    rightEngineBody: gltf.scene.getObjectByName("right_engine_body"),
    leftEngineThruster: gltf.scene.getObjectByName("left_engine_thruster"),
    rightEngineThruster: gltf.scene.getObjectByName("right_engine_thruster"),
    centerEngine: gltf.scene.getObjectByName("center_engine_body"),
    centerEngineThruster: gltf.scene.getObjectByName("center_engine_thruster"),
  };

  if (!spaceshipMesh || Object.values(empties).some((obj) => !obj)) {
    console.error("One or more required objects are missing in the GLTF.");
    return;
  }

  scene.add(spaceshipMesh);

  vertexGroups = {
    nose: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(empties.nose.matrixWorld),
      empties.nose.scale.x * 1
    ),
    leftWing: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(empties.leftWing.matrixWorld),
      empties.leftWing.scale.x * 1
    ),
    rightWing: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(empties.rightWing.matrixWorld),
      empties.rightWing.scale.x * 1
    ),
    leftEnginePoint: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(
        empties.leftEnginePoint.matrixWorld
      ),
      empties.leftEnginePoint.scale.x * 1
    ),
    rightEnginePoint: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(
        empties.rightEnginePoint.matrixWorld
      ),
      empties.rightEnginePoint.scale.x * 1
    ),
    leftEngine: [
      ...getVerticesInSphere(
        spaceshipMesh,
        new THREE.Vector3().setFromMatrixPosition(
          empties.leftEngineBody.matrixWorld
        ),
        empties.leftEngineBody.scale.x * 1
      ),
      ...getVerticesInSphere(
        spaceshipMesh,
        new THREE.Vector3().setFromMatrixPosition(
          empties.leftEngineThruster.matrixWorld
        ),
        empties.leftEngineThruster.scale.x * 1
      ),
    ],
    rightEngine: [
      ...getVerticesInSphere(
        spaceshipMesh,
        new THREE.Vector3().setFromMatrixPosition(
          empties.rightEngineBody.matrixWorld
        ),
        empties.rightEngineBody.scale.x * 1
      ),
      ...getVerticesInSphere(
        spaceshipMesh,
        new THREE.Vector3().setFromMatrixPosition(
          empties.rightEngineThruster.matrixWorld
        ),
        empties.rightEngineThruster.scale.x * 1
      ),
    ],
    centerEngine: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(
        empties.centerEngine.matrixWorld
      ),
      empties.centerEngine.scale.x * 1
    ),
    centerEngineThruster: getVerticesInSphere(
      spaceshipMesh,
      new THREE.Vector3().setFromMatrixPosition(
        empties.centerEngineThruster.matrixWorld
      ),
      empties.centerEngineThruster.scale.x * 1
    ),
  };
});

const sliderCallbacks = {
  nose: (value) => {
    const delta = value - sliderPrevValues.nose;
    adjustVertices(spaceshipMesh, vertexGroups.nose, "y", delta);
    sliderPrevValues.nose = value;
  },
  wing: (value) => {
    const delta = value - sliderPrevValues.wing;
    adjustVertices(
      spaceshipMesh,
      [...vertexGroups.leftWing, ...vertexGroups.rightWing],
      "y",
      delta
    );
    sliderPrevValues.wing = value;
  },
  enginePoint: (value) => {
    const delta = value - sliderPrevValues.enginePoint;

    // Adjust left and right engine points
    adjustVertices(spaceshipMesh, vertexGroups.leftEnginePoint, "y", delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightEnginePoint, "y", delta);

    sliderPrevValues.enginePoint = value;
  },
  wingSpread: (value) => {
    const delta = value - sliderPrevValues.wingSpread;
    adjustVertices(spaceshipMesh, vertexGroups.leftWing, "x", -delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightWing, "x", delta);
    sliderPrevValues.wingSpread = value;
  },
  leftEngine: (value) => {
    const delta = value - sliderPrevValues.leftEngine;
    adjustVertices(spaceshipMesh, vertexGroups.leftEngine, "y", delta);
    sliderPrevValues.leftEngine = value;
  },
  rightEngine: (value) => {
    const delta = value - sliderPrevValues.rightEngine;
    adjustVertices(spaceshipMesh, vertexGroups.rightEngine, "y", delta);
    sliderPrevValues.rightEngine = value;
  },
  centerEngine: (value) => {
    const delta = value - sliderPrevValues.centerEngine;
    adjustVertices(spaceshipMesh, vertexGroups.centerEngine, "y", delta);
    adjustVertices(
      spaceshipMesh,
      vertexGroups.centerEngineThruster,
      "y",
      delta
    );
    adjustVertices(spaceshipMesh, vertexGroups.nose, "y", delta);
    sliderPrevValues.nose = value;
    sliderPrevValues.centerEngineThruster = value;
    sliderPrevValues.centerEngine = value;
  },
  centerEngineThruster: (value) => {
    const delta = value - sliderPrevValues.centerEngineThruster;
    adjustVertices(
      spaceshipMesh,
      vertexGroups.centerEngineThruster,
      "y",
      delta
    );
    sliderPrevValues.centerEngineThruster = value;
  },
  engines: (value) => {
    const delta = value - sliderPrevValues.engines;
    adjustVertices(spaceshipMesh, vertexGroups.leftEngine, "y", delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightEngine, "y", delta);
    adjustVertices(
      spaceshipMesh,
      [...vertexGroups.leftWing, ...vertexGroups.rightWing],
      "y",
      delta
    );
    adjustVertices(spaceshipMesh, vertexGroups.leftEnginePoint, "y", delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightEnginePoint, "y", delta);

    sliderPrevValues.enginePoint = value;
    sliderPrevValues.wing = value;

    sliderPrevValues.engines = value;
  },
  engineSpread: (value) => {
    const delta = value - sliderPrevValues.engineSpread;

    // Adjust left and right engines
    adjustVertices(spaceshipMesh, vertexGroups.leftEngine, "x", -delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightEngine, "x", delta);

    // Adjust left and right engine points
    adjustVertices(spaceshipMesh, vertexGroups.leftEnginePoint, "x", -delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightEnginePoint, "x", delta);

    adjustVertices(spaceshipMesh, vertexGroups.leftWing, "x", -delta);
    adjustVertices(spaceshipMesh, vertexGroups.rightWing, "x", delta);
    sliderPrevValues.wingSpread = value;

    sliderPrevValues.engineSpread = value;
  },
};

initializeSliders(config.sliders, sliderCallbacks);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
