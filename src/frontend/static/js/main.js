// js/main.js


import * as THREE from './lib/three.module.js';
import { GUI } from './lib/lil-gui.esm.min.js'
import Stats from './lib/stats.module.js';

// Stats setup
const statsFPS = new Stats();
statsFPS.showPanel(0); // Panel 0 = fps
statsFPS.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
document.body.appendChild(statsFPS.domElement);

const statsMS = new Stats();
statsMS.showPanel(1); // Panel 1 = ms
statsMS.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
document.body.appendChild(statsMS.domElement);

const statsMB = new Stats();
statsMB.showPanel(2); // Panel 1 = ms
statsMB.domElement.style.cssText = 'position:absolute;top:0px;left:160px;';
document.body.appendChild(statsMB.domElement);

// GUI setup
const gui = new GUI();

const params = {
    xRotationSpeed: 0.01,
    yRotationSpeed: 0.01,
    zRotationSpeed: 0.01,
    color: 0x00ff00,
    freeze: function(){
        this.xRotationSpeed = 0;
        this.yRotationSpeed = 0;
        this.zRotationSpeed =0;
    }
}

gui.add( params, 'xRotationSpeed', 0, 0.3, 0.005).listen();
gui.add( params, 'yRotationSpeed', 0, 0.3, 0.005).listen();
gui.add( params, 'zRotationSpeed', 0, 0.3, 0.005).listen();
gui.addColor(params, 'color');
gui.add(params, 'freeze');


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

// Camera Controls Setup
document.addEventListener('mousewheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    camera.position.z += event.deltaY / 250;
}, { passive: false });

// Render loop
function tick() {
    statsFPS.begin()
    statsMS.begin()
    statsMB.begin()

    // Rotate the cube
    cube.rotation.x += params.xRotationSpeed;
    cube.rotation.y += params.yRotationSpeed;
    cube.rotation.z += params.zRotationSpeed;
    cube.material.color.setHex(params.color);


    // Render the scene
    renderer.render(scene, camera);

    statsFPS.end()
    statsMS.end()
    statsMB.end()

    requestAnimationFrame(tick);
}

tick();
