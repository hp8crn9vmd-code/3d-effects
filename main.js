import * as THREE from "three";

let tx=0, ty=0, px=0, py=0, hasPointer=false;

function setPointer(e){
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = (e.clientY / window.innerHeight) * 2 - 1;
  tx = THREE.MathUtils.clamp(x, -1, 1);
  ty = THREE.MathUtils.clamp(y, -1, 1);
  hasPointer = true;
}
window.addEventListener("pointermove", setPointer, {passive:true});
window.addEventListener("pointerdown", setPointer, {passive:true});

const mascot = document.getElementById("mascot");
const canvas = document.getElementById("bg");

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050712, 10, 70);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 250);
camera.position.set(0, 1.2, 9);

scene.add(new THREE.AmbientLight(0xffffff, 0.18));
const key = new THREE.PointLight(0xbfd1ff, 1.4, 60); key.position.set(6,6,6); scene.add(key);
const neon= new THREE.PointLight(0xa8ffe7, 1.0, 45); neon.position.set(-6,2,-2); scene.add(neon);

// Shader plane (neon madness)
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uTime:{value:0}, uAspect:{value:innerWidth/innerHeight} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uAspect;

      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.0-2.0*f);
        return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
      }
      vec3 palette(float t){
        vec3 a=vec3(0.05,0.03,0.10);
        vec3 b=vec3(0.55,0.25,0.95);
        vec3 c=vec3(0.35,0.95,0.80);
        vec3 d=vec3(0.80,0.25,0.55);
        return a + b*cos(6.28318*(c*t + d));
      }

      void main(){
        vec2 uv=vUv; uv.x*=uAspect;
        float t=uTime*0.12;

        float n1=noise(uv*3.0+vec2(t,-t));
        float n2=noise(uv*7.0-vec2(t*1.4,t*0.7));
        float n=(n1*0.7+n2*0.3);

        float rings=sin((uv.x*uv.x+uv.y*uv.y)*8.0 - uTime*0.9);
        rings=smoothstep(0.0,1.0,rings*0.5+0.5);

        float glow=pow(n,2.2)*0.9 + rings*0.35;

        vec3 col=palette(n+t)*glow;
        col += palette(rings+t*0.7)*0.25;

        float v=smoothstep(1.15,0.25,length(vUv-0.5));
        col *= v;

        gl_FragColor=vec4(col,0.85);
      }
    `
  })
);
plane.position.z = -10;
scene.add(plane);

// Glowing object + stars
const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.35, 0.42, 200, 24),
  new THREE.MeshStandardMaterial({
    color: 0x8aa3ff, roughness:0.25, metalness:0.55,
    emissive:0x25ffcc, emissiveIntensity:0.25
  })
);
knot.position.set(0,0.2,0);
scene.add(knot);

const starCount=2600;
const positions=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
  const r=30*Math.cbrt(Math.random());
  const theta=Math.random()*Math.PI*2;
  const phi=Math.acos(2*Math.random()-1);
  positions[i*3+0]=r*Math.sin(phi)*Math.cos(theta);
  positions[i*3+1]=r*Math.cos(phi)*0.8;
  positions[i*3+2]=r*Math.sin(phi)*Math.sin(theta);
}
const starsGeo=new THREE.BufferGeometry();
starsGeo.setAttribute("position", new THREE.BufferAttribute(positions,3));
const starsMat=new THREE.PointsMaterial({
  color:0xffffff, size:0.022, transparent:true, opacity:0.45,
  depthWrite:false, blending:THREE.AdditiveBlending
});
const stars=new THREE.Points(starsGeo, starsMat);
scene.add(stars);

function onResize(){
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  plane.material.uniforms.uAspect.value = innerWidth/innerHeight;
}
addEventListener("resize", onResize);

const clock=new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const t=clock.getElapsedTime();

  const ease=0.08;
  px += (tx-px)*ease;
  py += (ty-py)*ease;

  const mx = hasPointer ? px : Math.sin(t*0.4)*0.25;
  const my = hasPointer ? py : Math.cos(t*0.35)*0.18;

  plane.material.uniforms.uTime.value = t;

  camera.position.x = mx*1.2;
  camera.position.y = 1.2 + (-my)*0.6;
  camera.lookAt(0,0.1,0);

  key.position.x = 6 + mx*3.0;
  key.position.y = 6 + (-my)*2.0;
  neon.position.x = -6 + mx*2.4;
  neon.position.y = 2 + (-my)*1.2;

  knot.rotation.x = t*0.35 + (-my)*0.25;
  knot.rotation.y = t*0.55 + (mx)*0.35;

  stars.rotation.y = t*0.06;
  stars.rotation.x = t*0.02;

  const moveX = mx*28;
  const moveY = my*18;
  const rotY  = mx*14;
  const rotX  = -my*10;
  const bob   = Math.sin(t*2.0)*3.5;

  mascot.style.transform =
    `translate(-50%, -50%) perspective(900px)
     translate(${moveX}px, ${moveY + bob}px)
     rotateX(${rotX}deg) rotateY(${rotY}deg)
     scale(${1.0 + Math.sin(t*1.3)*0.01})`;

  renderer.render(scene, camera);
}
loop();
