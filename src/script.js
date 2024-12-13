import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";

const gui = new dat.GUI();

const canvas = document.querySelector("canvas.webgl");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
// canvas.style.background = "#002027";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#002027");

const parameter = {};
parameter.count = 10000;
parameter.size = 0.01;
parameter.radius = 5;
parameter.branches = 3;
parameter.spin = 1;
parameter.randomness = 2;

let particlesGeometry = null;
let particlesMaterial = null;
let particles = null;
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/textures/2.png");

// galaxy
const generateGalaxy = () => {
  if (particles !== null) {
    particlesGeometry.dispose();
    particlesMaterial.dispose();
    scene.remove(particles);
  }

  particlesGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(parameter.count * 3);
  const sizes = new Float32Array(parameter.count); // Sizes for each particle
  const colors = new Float32Array(parameter.count * 3);

  const colorSet = [
    new THREE.Color(0x21b1a2), // Red
    new THREE.Color(0x2978e0), // Blue
    new THREE.Color(0x289be0),
    new THREE.Color(0x282c34),
    // Yellow
  ];

  const sizeSet = [0.03, 0.02, 0.03, 0.04, 0.05];

  for (let i = 0; i < parameter.count; i++) {
    const angle =
      (i % parameter.branches) * ((Math.PI * 2) / parameter.branches);

    const radius = Math.random() * parameter.radius;
    const spinAngle = radius * parameter.spin;

    const randomX = Math.pow((Math.random() - 0.5) * parameter.randomness, 2);
    const randomY = Math.pow((Math.random() - 0.5) * parameter.randomness, 2);
    const randomZ = Math.pow((Math.random() - 0.5) * parameter.randomness, 2);

    // Randomly select a color from the set
    const randomColor = colorSet[Math.floor(Math.random() * colorSet.length)];
    colors[i * 3] = randomColor.r; // r
    colors[i * 3 + 1] = randomColor.g; // g
    colors[i * 3 + 2] = randomColor.b; // b

    // Randomly select a size from the set
    sizes[i] = sizeSet[Math.floor(Math.random() * sizeSet.length)];

    particlePositions[i * 3] = Math.cos(angle + spinAngle) * radius + randomX;
    particlePositions[i * 3 + 1] = randomY;
    particlePositions[i * 3 + 2] =
      Math.sin(angle + spinAngle) * radius + randomZ;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Particle Material
  const particlesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: particleTexture },
    },
    vertexShader: `
    attribute float size;
    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z); // Adjust size based on perspective
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    uniform sampler2D pointTexture;
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
    }
  `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // particlesMaterial = new THREE.PointsMaterial({
  //   size: parameter.size,
  //   sizeAttenuation: true,
  //   // color: "red",
  //   transparent: true,
  //   vertexColors: true, // Use per-particle colors
  //   blending: THREE.AdditiveBlending,
  //   depthWrite: false,
  //   map: particleTexture,
  // });

  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);
};

gui
  .add(parameter, "count")
  .min(100)
  .max(100000)
  .step(100)
  .onFinishChange(() => {
    generateGalaxy();
  });

gui
  .add(parameter, "size")
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .onFinishChange(() => {
    generateGalaxy();
  });

gui
  .add(parameter, "branches")
  .min(2)
  .max(10)
  .step(1)
  .onFinishChange(() => {
    generateGalaxy();
  });

gui
  .add(parameter, "radius")
  .min(1)
  .max(20)
  .step(1)
  .onFinishChange(() => {
    generateGalaxy();
  });

gui
  .add(parameter, "spin")
  .min(-5)
  .max(5)
  .step(0.001)
  .onFinishChange(() => {
    generateGalaxy();
  });

gui
  .add(parameter, "randomness")
  .min(1)
  .max(10)
  .step(0.001)
  .onFinishChange(() => {
    generateGalaxy();
  });

generateGalaxy();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
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
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  particles.rotation.y = elapsedTime * 0.02;
  // particles.position.x = -elapsedTime * 0.005;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
