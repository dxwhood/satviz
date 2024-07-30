// js/main.js


import * as THREE from './lib/three.module.js';
import { GUI } from './lib/lil-gui.esm.min.js'


// GUI setup
const gui = new GUI();

const params = {
    xRotationSpeed: 0.01,
    yRotationSpeed: 0.01,
    zRotationSpeed: 0.01,
    color: 0x00ff00
}

gui.add( params, 'xRotationSpeed', 0, 0.3, 0.005);
gui.add( params, 'yRotationSpeed', 0, 0.3, 0.005);
gui.add( params, 'zRotationSpeed', 0, 0.3, 0.005);
gui.addColor( params, 'color');


// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Geometry
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: params.color });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Position the camera
camera.position.z = 5;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube
    cube.rotation.x += params.xRotationSpeed;
    cube.rotation.y += params.yRotationSpeed;
    cube.rotation.z += params.zRotationSpeed;
    cube.material.color.setHex(params.color);


    // Render the scene
    renderer.render(scene, camera);
}

animate();
