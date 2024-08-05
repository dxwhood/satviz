// js/main.js

import * as THREE from './lib/three.module.js';
import { GUI } from './lib/lil-gui.esm.min.js'
import Stats from './lib/stats.module.js';
import {OrbitControls} from './lib/OrbitControls.js'
import * as sat_utils from './satellite_utils.js'


const SCALE_FACTOR = 1274; // divide km by this to get units in 3D space

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


// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const axesHelper = new THREE.AxesHelper(1000);
scene.add( axesHelper );

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Earth textures load
const dayTexture = new THREE.TextureLoader().load('/static/assets/textures/earthmap10k.jpg')  
const nightTexture = new THREE.TextureLoader().load('/static/assets/textures/earthlights10k.jpg')
const bumpTexture = new THREE.TextureLoader().load('/static/assets/textures/earthbump10k.jpg')

// Geometry
const geometry = new THREE.SphereGeometry(5, 200, 100); 
const material = new THREE.MeshPhongMaterial({
    map: dayTexture, //default texture: day
    bumpMap: bumpTexture,
    bumpScale: 80
});
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040, 20); // Soft white light
scene.add(ambientLight); 

// Position the camera
camera.position.z = 20;

// Orbit Camera Control Setup
const controls = new OrbitControls(camera, renderer.domElement)
// Allow for full rotation
controls.maxPolarAngle = Math.PI; // 180 degrees
controls.minPolarAngle = 0;      
controls.maxAzimuthAngle = Infinity; // Unlimited horizontal rotation
controls.minAzimuthAngle = -Infinity; // Unlimited horizontal rotation
controls.enableDamping = true; // Enable damping for smoother controls
controls.dampingFactor = 0.01;
controls.enablePan = false; 


// GUI setup
const gui = new GUI();

const params = {
    xRotationSpeed: 0,
    yRotationSpeed: 0,
    zRotationSpeed: 0,
    globeSize: 1,
    bumpScale: 80,
    texture: dayTexture,
    axes: true, //toggle helper axes

    freeze: function(){
        this.xRotationSpeed = 0;
        this.yRotationSpeed = 0;
        this.zRotationSpeed =0;
    },
    resetToOrigin: function(){
        globe.rotation.x = 0;
        globe.rotation.y = 0;
        globe.rotation.z = 0;
    }
}

gui.add(params, 'xRotationSpeed', 0, 0.3, 0.005).listen();
gui.add(params, 'yRotationSpeed', 0, 0.3, 0.005).listen();
gui.add(params, 'zRotationSpeed', 0, 0.3, 0.005).listen();
gui.add(params, 'globeSize', 1, 20, 0.2).listen();
gui.add(params, 'texture', {day: dayTexture, night: nightTexture, 'day and night': dayTexture}).onChange(value => {
    globe.material.map = value;
    globe.material.needsUpdate = true;}); // TODO: add day & night real-ish time
gui.add(params, 'bumpScale', 0, 200).onChange(value => {
    globe.material.bumpScale = value;
    globe.material.needsUpdate = true;});
gui.add(params, 'axes').onChange(function(){
    axesHelper.visible = !axesHelper.visible;
})
gui.add(params, 'freeze');
gui.add(params, 'resetToOrigin');


function fetchData() {
    return fetch('/api/gp_data')
        .then(response => {
           return response.json();
        })
        .catch(error => console.error('Error fetching data:', error));
}

// JS array slicing example as comment:
// const arr = [1, 2, 3, 4, 5];
// const slicedArr = arr.slice(1, 3); // [2, 3]

let positionTest = null;
fetchData()
.then(gp_data => {
    console.log("Example" + gp_data[1])
    let gp_slice = gp_data.slice(0, 10)
    let tle_data = sat_utils.excract_TLE(gp_slice)
    console.log(tle_data)

    positionTest = sat_utils.get_sat_ecef(tle_data[1])
    return positionTest
})
.then(coords => {
    console.log(coords);
    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([coords.x/SCALE_FACTOR, coords.y/SCALE_FACTOR, coords.z/SCALE_FACTOR]), 3));
    const dotMaterial = new THREE.PointsMaterial({ size: 0.1, color: 0xff0000 });
    const dot = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dot);
}
)



// Point render Test



// Render loop
function tick() {
    statsFPS.begin()
    statsMS.begin()
    statsMB.begin()

    controls.update()

    // Rotate the globe
    globe.rotation.x += params.xRotationSpeed;
    globe.rotation.y += params.yRotationSpeed;
    globe.rotation.z += params.zRotationSpeed;

    // Scale the globe
    globe.scale.set(params.globeSize, params.globeSize, params.globeSize);

    // Render the scene
    renderer.render(scene, camera);

    // Update camera position text
    const cameraPosition = document.getElementById('cameraPosition');
    cameraPosition.innerText = `Camera Position: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}`;
    

    statsFPS.end()
    statsMS.end()
    statsMB.end()

    requestAnimationFrame(tick);
}

tick();
