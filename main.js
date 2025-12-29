import * as THREE from "three";

const canvas = document.getElementById("bg");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050712, 12, 55);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0.2, 1.0, 8.0);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));

const key = new THREE.DirectionalLight(0xbfd1ff, 1.15);
key.position.set(7, 9, 6);
scene.add(key);

const rim = new THREE.DirectionalLight(0xa8ffe7, 0.55);
rim.position.set(-7, 2, -6);
scene.add(rim);

const blobGeo = new THREE.IcosahedronGeometry(1.7, 4);
const blobMat = new THREE.MeshPhysicalMaterial({
  color: 0x9aa7ff,
  roughness: 0.25,
  metalness: 0.35,
  clearcoat: 0.9,
  clearcoatRoughness: 0.2,
  transmission: 0.12,
  thickness: 0.6,
});
const blob = new THREE.Mesh(blobGeo, blobMat);
blob.position.set(0, 0.1, 0);
scene.add(blob);

const wire = new THREE.LineSegments(
  new THREE.WireframeGeometry(blobGeo),
  new THREE.LineBasicMaterial({ color: 0x9ffff0, transparent: true, opacity: 0.18 })
);
wire.scale.setScalar(1.01);
scene.add(wire);

const starCount = 1800;
const pos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 22 * Math.cbrt(Math.random());
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
  pos[i * 3 + 1] = r * Math.cos(phi) * 0.7;
  pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}

const starsGeo = new THREE.BufferGeometry();
starsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

const starsMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.02,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

const stars = new THREE.Points(starsGeo, starsMat);
scene.add(stars);

let t0 = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const t = (performance.now() - t0) * 0.001;

  camera.position.x = Math.sin(t * 0.15) * 0.35 + 0.15;
  camera.position.y = 1.0 + Math.sin(t * 0.12) * 0.15;
  camera.lookAt(0, 0.1, 0);

  blob.rotation.y = t * 0.22;
  blob.rotation.x = t * 0.14;
  wire.rotation.copy(blob.rotation);

  stars.rotation.y = t * 0.03;
  stars.rotation.x = t * 0.01;

  renderer.render(scene, camera);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", onResize);

animate();
