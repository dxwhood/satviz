// main.js

import * as THREE from './lib/three.module.js';
import { GUI } from './lib/lil-gui.esm.min.js'
import Stats from './lib/stats.module.js';
import {OrbitControls} from './lib/OrbitControls.js'
import * as utils from './satellite_utils.js'


const App = (() => {
    let scene, camera, renderer, controls, sats = null;
    let worker;
    let stats;
    
    const textures = {day: 'day', night: null, bump: null}; // String placeholder for GUI

    // Implement sate object 
    let state = {
        sats: [],
        satPoints: null,
        globe: null,
        axesHelper: null,
        raycaster: null,
        pointer: null,
        currentlyHovered: null,
        currentlySelected: null,
        hoverTimer: null,
    }

    // GUI parameters
    const params = {
        globeSize: 1,
        bumpScale: 80,
        texture: textures.day,
        axes: true, //toggle helper axes
    }
    
    function loadTextures() {
        textures.day = new THREE.TextureLoader().load('/static/assets/textures/earthmap10k.jpg');
        textures.night = new THREE.TextureLoader().load('/static/assets/textures/earthlights10k.jpg');
        textures.bump = new THREE.TextureLoader().load('/static/assets/textures/earthbump10k.jpg');
    }

    // Function to initialize Three.js scene
    function initScene() {
        scene = new THREE.Scene();

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 200, 0); // Adjust initial position as needed
        camera.up.set( 0, 0, 1 );

        // Camera controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        
        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5).normalize();
        scene.add(light);
        const ambientLight = new THREE.AmbientLight(0x404040, 20); // Soft white light
        scene.add(ambientLight); 

        // Axes helper
        const axesHelper = new THREE.AxesHelper(1000);
        state.axesHelper = axesHelper; // Add to state
        scene.add(axesHelper);

        // Load textures
        loadTextures();

        // Globe setup
        const globeGeometry = new THREE.SphereGeometry(utils.EARTH_SIZE, 200, 100); 
        const globeMaterial = new THREE.MeshPhongMaterial({
            map: textures.day, //default texture: day
            bumpMap: textures.bump,
            bumpScale: 80
        });

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        state.globe = globe; // Add to state
        scene.add(globe);
        state.globe.rotation.x = Math.PI/2; // Rotate globe to match ECEF coordinates
    }

    // GUI setup 
    function initGUI() {
        const gui = new GUI();
        gui.add(params, 'texture', {day: textures.day, night: textures.night, 'day and night': textures.day}).onChange(value => {
            state.globe.material.map = value;
            state.globe.material.needsUpdate = true;}); // TODO: add day & night real-ish time
        gui.add(params, 'bumpScale', 0, 200).onChange(value => {
            state.globe.material.bumpScale = value;
            state.globe.material.needsUpdate = true;});
        gui.add(params, 'axes').onChange(function(){
            state.axesHelper.visible = !state.axesHelper.visible;
        })
    }

    function initStats() {
        const statsFPS = new Stats();
        statsFPS.showPanel(0); // Panel 0 = fps
        statsFPS.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
        document.body.appendChild(statsFPS.domElement);

        const statsMS = new Stats();
        statsMS.showPanel(1); // Panel 1 = ms
        statsMS.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
        document.body.appendChild(statsMS.domElement);

        const statsMB = new Stats();
        statsMB.showPanel(2); // Panel 2 = mb
        statsMB.domElement.style.cssText = 'position:absolute;top:0px;left:160px;';
        document.body.appendChild(statsMB.domElement);

        return { fps: statsFPS, ms: statsMS, mb: statsMB };
    }


    // Function to initialize satellites and fetch data
    async function initSatellites() {
        try {
            const response = await fetch('/api/gp_data');
            const gp_data = await response.json();
            // sats = utils.extend_sat_objects(gp_data.slice(0, 100));
            sats = utils.extend_sat_objects(gp_data);

            state.sats = sats; // Add to state

            console.log(sats[142]); // Print a satellite object for debugging

            // Satellite Material and Geometry
            const satGeometry = new THREE.BufferGeometry();
            const satMaterial = new THREE.ShaderMaterial({
                uniforms: { size: { value: 1 } },
                vertexShader: utils.vertexShader, // vertexShaderCode from your original code
                fragmentShader: utils.fragmentShader, // fragmentShaderCode from your original code
                transparent: true
            });

            const satPoints = new THREE.Points(satGeometry, satMaterial);
            state.satPoints = satPoints; // Add to state
            scene.add(satPoints);

            let positions = new Float32Array(sats.length * 3);
            let indices = new Float32Array(sats.length);

            for(let i = 0; i < sats.length; i++) {
                indices[i] = i;
            }

            satGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            satGeometry.setAttribute('index', new THREE.BufferAttribute(indices, 1));

            worker = new Worker('./static/js/satelliteWorker.js', { type: "module" });
            worker.postMessage({ type: 'initialize', sats });

            // Setup worker response handler
            worker.onmessage = function(e) {
                const { buffer } = e.data;
                let positions = new Float32Array(buffer);
                satGeometry.attributes.position.array.set(positions);
                satGeometry.attributes.position.needsUpdate = true;
                satGeometry.computeBoundingSphere();
            };
        } catch (error) {
            console.error('Error fetching satellite data:', error);
        }
    }

    function initRaycaster() {
        const raycaster = new THREE.Raycaster();
        state.raycaster = raycaster; // Add to state
        raycaster.params.Points.threshold = 0.2;
        const pointer = new THREE.Vector2();
        state.pointer = pointer; // Add to state

        // Handle mouse movements
        document.addEventListener('pointermove', (event) => {
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    function raycasterIntersect() {
        // Raycaster
        state.raycaster.setFromCamera(state.pointer, camera);
        const intersects = state.raycaster.intersectObject(state.satPoints);

        if (intersects.length > 0) {
            const intersected = intersects[0];
            const satIndex = intersected.index;
            // console.log(`Hovered Satellite: ${state.sats[satIndex]['OBJECT_NAME']} | ${state.sats[satIndex]['NORAD_CAT_ID']}`);
            
            return intersected;
        }
        else { 
            return null;
        }
    }

    function hoverThreshold(currentlyHovered, seconds = 0.25) {
        let timeNow = performance.now();
        if (currentlyHovered === null){
        }
        else if (state.currentlyHovered === null){
            state.currentlyHovered = currentlyHovered;
            state.hoverTimer = timeNow;
        }
        else if (currentlyHovered.index !== state.currentlyHovered.index){
            state.currentlyHovered = currentlyHovered;
            state.hoverTimer = timeNow;
        }
        else if (timeNow - state.hoverTimer > 1000 * seconds){ 
            state.currentlySelected = currentlyHovered;
            return true;
        }
        return false;
    }

    function displaySatelliteName(satIndex){
        console.log(`Selected Satellite: ${state.sats[satIndex]['OBJECT_NAME']} | ${state.sats[satIndex]['NORAD_CAT_ID']}`);
        // Create threejs text right above the satellite
        const text = new THREE.TextGeometry(state.sats[satIndex]['OBJECT_NAME'], { font: 'helvetiker', size: 10, height: 5 });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(text, textMaterial);
        textMesh.position.set(state.sats[satIndex]['']); // Set position to satellite position
    }
    
    // Function for the rendering loop
    function tick() {
        Object.values(stats).forEach(stat => stat.begin()); //Begin stats monitoring

        requestAnimationFrame(tick);

        // Update the worker with the latest positions
        let positions = new Float32Array(state.satPoints.geometry.attributes.position.array);
        worker.postMessage({ type: 'update', epoch: new Date(), buffer: positions.buffer }, [positions.buffer]);

        // Raycaster
        let currentlyHovered = raycasterIntersect();
        if (currentlyHovered && hoverThreshold(currentlyHovered)){
            displaySatelliteName(currentlyHovered.index);
        }


        controls.update();

        renderer.render(scene, camera);

        Object.values(stats).forEach(stat => stat.end()); //End stats monitoring
    }


    // Accessible functions
    return {
        init: function() {
            const timestamp = performance.now();
            loadTextures();
            initScene();
            initRaycaster();
            initGUI();
            stats = initStats();     
            initSatellites().then(() => {
                tick(); // Start the render loop once everything is initialized
            });
        },
        getSatellites: function() {
            return sats; // Provides access to satellite data if necessary
        }
    };
})();

// Start the application
App.init();




