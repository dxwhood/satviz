// js/main.js

import * as THREE from './lib/three.module.js';
import { GUI } from './lib/lil-gui.esm.min.js'
import Stats from './lib/stats.module.js';
import {OrbitControls} from './lib/OrbitControls.js'
import * as utils from './satellite_utils.js'

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
const geometry = new THREE.SphereGeometry(utils.EARTH_SIZE, 200, 100); 
const material = new THREE.MeshPhongMaterial({
    map: dayTexture, //default texture: day
    bumpMap: bumpTexture,
    bumpScale: 80
});
const globe = new THREE.Mesh(geometry, material);
//rotate the globe so that the texture is facing the right way
scene.add(globe);
globe.rotation.x = Math.PI/2;

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040, 20); // Soft white light
scene.add(ambientLight); 


camera.position.set(0, 200, 0); // Adjust initial position as needed
camera.up.set( 0, 0, 1 );


const controls = new OrbitControls(camera, renderer.domElement);

// Allow for full rotation
controls.maxPolarAngle = Math.PI; // 180 degrees
controls.minPolarAngle = 0;
controls.maxAzimuthAngle = Infinity; // Unlimited horizontal rotation
controls.minAzimuthAngle = -Infinity; // Unlimited horizontal rotation
controls.enableDamping = true; // Enable damping for smoother controls
controls.dampingFactor = 0.05;
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


function fetchGPData() {
    return fetch('/api/gp_data')
        .then(response => {
           return response.json();
        })
        .catch(error => console.error('Error fetching data:', error));
}



// Custom Shader Material for Circular Points
const uniforms = {
    size: { value: 1 }
};

const vertexShader = `
uniform float size;
void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z); // Scale point size based on distance
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
void main() {
    float r = 0.0, delta = 0.0, alpha = 0.8;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
    if (r > 1.0) {
        discard;
    }
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha); 
}
`;

const satMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true
});

const worker = new Worker('./static/js/satelliteWorker.js', { type: "module" });

// satmaterial as points

let sats = [];
const satGeometry = new THREE.BufferGeometry();
const sat_points = new THREE.Points(satGeometry,satMaterial);



fetchGPData()
.then(gp_data => {

    //find the min and max EPOCH values
    let min_epoch = gp_data[0].EPOCH;
    let max_epoch = gp_data[0].EPOCH;
    let min_altitude = gp_data[0].MEAN_MOTION;
    let max_altitude = gp_data[0].MEAN_MOTION;
    for (let i = 0; i < gp_data.length; i++) {
        if (gp_data[i].EPOCH < min_epoch) {
            min_epoch = gp_data[i].EPOCH;
            min_altitude = gp_data[i].MEAN_MOTION;
        }
        if (gp_data[i].EPOCH > max_epoch) {
            max_epoch = gp_data[i].EPOCH;
            max_altitude = gp_data[i].MEAN_MOTION;
        }
    }
    console.log('min_epoch:', min_epoch);
    console.log('max_epoch:', max_epoch);
    gp_data = gp_data.slice(0, 100);
  
    sats = utils.extend_sat_objects(gp_data);

    return sats;
})
.then(sats => {

    let positions = new Float32Array(sats.length * 3);
    let indices = new Float32Array(sats.length * 3);

    for(let i=0; i < sats.length; i++){
        indices[i] = i;
    }

    satGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    satGeometry.setAttribute('index', new THREE.BufferAttribute(indices), 1);
    scene.add(sat_points);


    // Send sats to the worker for initialization
    worker.postMessage({ type: 'initialize', sats });

    tick();
})

worker.onmessage = function(e) {
    const { buffer } = e.data;
    let positions = new Float32Array(buffer);

    // Update positions in the geometry
    satGeometry.attributes.position.array.set(positions);
    satGeometry.attributes.position.needsUpdate = true;
    // Update positions in the sats array
    for (let i = 0; i < sats.length; i++) {
        sats[i].position = { x: positions[i * 3], y: positions[i * 3 + 1], z: positions[i * 3 + 2]};
    }
    satGeometry.computeBoundingSphere();

};



// Initialize Raycaster
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.2;
const pointer = new THREE.Vector2();

// Handle mouse movements
document.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

let timeNow = Date.now();
let polling_rate = 1000/5

// Render loop
function tick() {

    statsFPS.begin()
    statsMS.begin()
    statsMB.begin()


    // Rotate the globe
    globe.rotation.x += params.xRotationSpeed;
    globe.rotation.y += params.yRotationSpeed;
    globe.rotation.z += params.zRotationSpeed;

    // Scale the globe
    globe.scale.set(params.globeSize, params.globeSize, params.globeSize);


    let positions = new Float32Array(satGeometry.attributes.position.array);
    worker.postMessage({ type: 'update', epoch: new Date(), buffer: positions.buffer }, [positions.buffer]);

    // compute bounding box of points buffergeometry based on polling
    if (Date.now() - timeNow > polling_rate){
        timeNow = Date.now();        


        // Update raycaster
        raycaster.setFromCamera(pointer, camera);

        // Check for intersections with satellite points
        const intersects = raycaster.intersectObject(sat_points);

        if (intersects.length > 0) {
            const intersected = intersects[0];

            // Log the intersected satellite
            const satIndex = intersected.index;
            console.log('Hovered Satellite:', sats[satIndex]['OBJECT_NAME']);
        }

    }

    controls.update()

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


