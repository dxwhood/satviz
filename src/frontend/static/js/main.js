// js/main.js


import * as THREE from './lib/three.module.js';


// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Geometry
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Position the camera
camera.position.z = 5;

// Handle rotation speed controls
const rotationSpeedXSlider = document.getElementById('rotationSpeedX');
const rotationSpeedXValueLabel = document.getElementById('rotationSpeedXValue');
let rotationSpeedX = parseFloat(rotationSpeedXSlider.value);

rotationSpeedXSlider.addEventListener('input', function () {
    rotationSpeedX = parseFloat(this.value);
    rotationSpeedXValueLabel.innerHTML = rotationSpeedX.toFixed(2);
});

// Handle rotation speed controls
const rotationSpeedYSlider = document.getElementById('rotationSpeedY');
const rotationSpeedYValueLabel = document.getElementById('rotationSpeedYValue');
let rotationSpeedY = parseFloat(rotationSpeedYSlider.value);

rotationSpeedYSlider.addEventListener('input', function () {
    rotationSpeedY = parseFloat(this.value);
    rotationSpeedYValueLabel.innerHTML = rotationSpeedY.toFixed(2);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube
    cube.rotation.x += rotationSpeedX
    cube.rotation.y += rotationSpeedY

    // Render the scene
    renderer.render(scene, camera);
}

animate();
