import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";

const gui = new dat.GUI();

const canvas = document.querySelector("canvas.webgl");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
// canvas.style.background = "#002027";

const scene = new THREE.Scene();
// scene.background = new THREE.Color("#000000");
scene.background = new THREE.Color("#002027");

// const ctx = canvas.getContext("2d");

// Define a linear gradient
// const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
// gradient.addColorStop(0, "#ff7e79"); // Top color
// gradient.addColorStop(1, "#6fb7ff"); // Bottom color

// Fill the canvas with the gradient
// ctx.fillStyle = gradient;
// ctx.fillRect(0, 0, canvas.width, canvas.height);

// Create a texture from the canvas
// const gradientTexture = new THREE.CanvasTexture(canvas);

// Set the gradient as the scene background
// scene.background = gradientTexture;

const parameter = {};
parameter.count = 5000;
parameter.size = 0.1;
parameter.radius = 7;
parameter.angle = 0.1;
parameter.branches = 3;
parameter.spin = 1;
parameter.randomness = 2;

let particlesGeometry = null;
let particlesMaterial = null;
let particles = null;
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/textures/1.png");

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
  const speeds = new Float32Array(parameter.count);
  const randomValues = new Float32Array(parameter.count * 3);

  const gradientMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color1: { value: new THREE.Color("#002026") }, // Start color
      color2: { value: new THREE.Color("#000606") }, // End color
      time: { value: 0.0 }, // Uniform for time
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv; // Pass UV coordinates to the fragment shader
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      uniform float time;
      varying vec2 vUv;
      void main() {
        // Calculate a dynamic direction factor using time
        float directionX = sin(time) * 0.5 - 0.5; // Oscillates between 0 and 1
        float directionY = cos(time) * 0.5 - 0.5; // Oscillates between 0 and 1
        
        // Blend based on dynamic direction
        float gradientFactor = (vUv.x * directionX + vUv.y * directionY) / (directionX + directionY);
        gl_FragColor = vec4(mix(color1, color2, gradientFactor), 1.0);
      }
    `,
    depthWrite: false, // Prevent depth buffering for background
    depthTest: false,
  });

  // Fullscreen Quad for Background
  const quadGeometry = new THREE.PlaneGeometry(2, 2); // Fullscreen plane
  const quad = new THREE.Mesh(quadGeometry, gradientMaterial);
  scene.add(quad);

  //

  const colorSet = [
    new THREE.Color(0x21b1a2), // Red
    new THREE.Color(0x2978e0), // Blue
    new THREE.Color(0x289be0),
    new THREE.Color(0x282c34),
  ];

  const sizeSet = [0.03, 0.05, 0.07, 0.09, 0.11];

  for (let i = 0; i < parameter.count; i++) {
    // const angle =
    //   (i % parameter.branches) * ((Math.PI * 2) / parameter.branches);

    // const radius = Math.random() * parameter.radius;
    // const spinAngle = radius * parameter.spin;

    const randomX = Math.pow((Math.random() - 0.5) * parameter.randomness, 2);
    const randomY = Math.pow((Math.random() - 0.5) * parameter.randomness, 2);
    const randomZ = Math.pow((Math.random() - 0.5) * parameter.randomness, 2);

    randomValues[i * 3] = randomX;
    randomValues[i * 3 + 1] = randomY;
    randomValues[i * 3 + 2] = randomZ;

    // Randomly select a color from the set
    const randomColor = colorSet[Math.floor(Math.random() * colorSet.length)];
    colors[i * 3] = randomColor.r; // r
    colors[i * 3 + 1] = randomColor.g; // g
    colors[i * 3 + 2] = randomColor.b; // b

    // Randomly select a size from the set
    sizes[i] = sizeSet[Math.floor(Math.random() * sizeSet.length)];

    const angle = i * Math.PI;

    particlePositions[i * 3] =
      Math.sin((i / parameter.count) * Math.PI * 2) *
        Math.cos((i / parameter.count) * Math.PI * 2) *
        parameter.radius +
      randomX;

    particlePositions[i * 3 + 1] = randomY;
    particlePositions[i * 3 + 2] =
      Math.cos((i / parameter.count) * Math.PI * 2) * parameter.radius +
      randomZ;

    speeds[i] = Math.random() * 0.02 + 0.01; // Speed range: 0.01 to 0.03
    // Math.sin(angle + spinAngle) * radius + randomZ;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));
  particlesGeometry.setAttribute(
    "random",
    new THREE.BufferAttribute(randomValues, 3)
  );

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

gui
  .add(parameter, "angle")
  .min(0.01)
  .max(0.01)
  .step(0.5)
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

let time = Date.now();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const currentTime = Date.now();
  const deltaTime = currentTime - time;
  time = currentTime;

  // Update controls
  controls.update();

  // particles.rotation.y = elapsedTime * 0.02;
  // particles.position.x = -elapsedTime * 0.005;\

  const positions = particlesGeometry.attributes.position.array;
  const speeds = particlesGeometry.attributes.speed.array;
  const randomValues = particlesGeometry.attributes.random.array;

  for (let i = 0; i < parameter.count; i++) {
    // Update positions based on unique paths and speeds
    const index = i * 3;
    // positions[index] += Math.sin(Date.now() * 0.00001 * speeds[i]) * 0.001; // x (sinusoidal path)
    // // positions[index + 1] += Math.cos(Date.now() * 0.000001 * speeds[i]) * 0.001; // y (cosine path)
    // positions[index + 2] +=
    //   Math.sin(Date.now() * 0.000001 * speeds[i] * 0.5) * 0.001; // z (optional variation)

    //  particlePositions[i * 3] =
    //    Math.sin((i / parameter.count) * Math.PI * 2) *
    //      Math.cos((i / parameter.count) * Math.PI * 2) *
    //      parameter.radius +
    //    randomX;

    // particlePositions[i * 3 + 1] = randomY;
    // particlePositions[i * 3 + 2] =
    //   Math.cos((i / parameter.count) * Math.PI * 2) * parameter.radius +
    //   randomZ;

    positions[index] =
      Math.sin(
        (i / parameter.count) * Math.PI * 2 +
          Math.PI * 2 * 0.1 * elapsedTime * speeds[i]
      ) *
        Math.cos(
          (i / parameter.count) * Math.PI * 2 +
            Math.PI * 2 * 0.1 * elapsedTime * speeds[i]
        ) *
        parameter.radius +
      randomValues[index];

    positions[index + 2] =
      Math.cos(
        (i / parameter.count) * Math.PI * 2 +
          Math.PI * 2 * 0.1 * elapsedTime * speeds[i]
      ) *
        parameter.radius +
      randomValues[index + 2];
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};
3;
tick();
