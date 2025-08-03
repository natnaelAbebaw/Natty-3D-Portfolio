// Scene setup

import * as THREE from 'three';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Define curved rectangular path
class RoundedRectCurve extends THREE.Curve {
  constructor(width = 6, height = 10, radius = 2) {
      super();
      this.width = width;
      this.height = height;
      // Constrain radius to avoid overlapping corners
      this.radius = Math.min(radius, Math.min(width, height) / 2);

      
      const straightH = width - 2 * radius;
      const straightV = height - 2 * radius;
      const arcLength = (Math.PI * radius) / 2;
      this.totalLength = 2 * (straightH + straightV) + 4 * arcLength;

      this.segLengths = [
          straightH,  // top
          arcLength,  // top-right
          straightV,  // right
          arcLength,  // bottom-right
          straightH,  // bottom
          arcLength,  // bottom-left
          straightV,  // left
          arcLength   // top-left
        ];

     this.segTimes = this.segLengths.map(l => l / this.totalLength);

    this.segCumulative = this.segTimes.reduce((acc, val, i) => {
     acc.push((acc[i - 1] || 0) + val);
     return acc;
     }, []);

  }

  getPoint(t) {
  let segment = 0;
  while (segment < this.segCumulative.length && t >= this.segCumulative[segment]) segment++;

  const t0 = segment === 0 ? 0 : this.segCumulative[segment - 1];
  const localT = (t - t0) / (this.segCumulative[segment] - t0); // normalized in [0, 1]
  console.log(`Segment: ${segment}, Local T: ${localT}`);
  const cx = this.width / 2;
  const cy = this.height / 2;
  const left = -this.width / 2 + this.radius;
  const right = this.width / 2 - this.radius;
  const top = -this.height / 2 + this.radius;
  const bottom = this.height / 2 - this.radius;

  switch (segment) {
    case 0: // top horizontal
      return { x: left + localT * (right - left), y: top - this.radius };
    case 1: { // top-right arc
      const angle = -Math.PI / 2 + localT * (Math.PI / 2);
      return {
        x: right + this.radius * Math.cos(angle),
        y: top + this.radius * Math.sin(angle)
      };
    }
    case 2: // right vertical
      return { x: right + this.radius, y: top + localT * (bottom - top) };
    case 3: { // bottom-right arc
      const angle = 0 + localT * (Math.PI / 2);
      return {
        x: right + this.radius * Math.cos(angle),
        y: bottom + this.radius * Math.sin(angle)
      };
    }
    case 4: // bottom horizontal
      return { x: right - localT * (right - left), y: bottom + this.radius };
    case 5: { // bottom-left arc
      const angle = Math.PI / 2 + localT * (Math.PI / 2);
      return {
        x: left + this.radius * Math.cos(angle),
        y: bottom + this.radius * Math.sin(angle)
      };
    }
    case 6: // left vertical
      return { x: left - this.radius, y: bottom - localT * (bottom - top) };
    case 7: { // top-left arc
      const angle = Math.PI + localT * (Math.PI / 2);
      return {
        x: left + this.radius * Math.cos(angle),
        y: top + this.radius * Math.sin(angle)
      };
    }
  }

  }
}

// Create path
const path = new RoundedRectCurve(6, 10, 2);

// Create snake (chain of spheres)
const snakeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 50 });
const snakeSegments = [];
const numSegments = 20;
const segmentSpacing = 0.005;

for (let i = 0; i < numSegments; i++) {
  const geometry = new THREE.BoxGeometry(0.2, 0.01, 0.2);
  const segment = new THREE.Mesh(geometry, snakeMaterial);
  scene.add(segment);
  snakeSegments.push(segment);
}

// Visualize path
const pathGeometry = new THREE.BufferGeometry().setFromPoints(
  Array.from({ length: 100 }, (_, i) => path.getPoint(i / 100))
);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
const pathLine = new THREE.Line(pathGeometry, pathMaterial);
scene.add(pathLine);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Animation variables
let t = 0;
const speed = 0.002;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update snake segments
  t = (t + speed) % 1;
  for (let i = 0; i < snakeSegments.length; i++) {
      const segmentT = (t - i * segmentSpacing + 1) % 1;
      const position = path.getPoint(segmentT);
      snakeSegments[i].position.set(position.x, position.y, position.z);
  }

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});