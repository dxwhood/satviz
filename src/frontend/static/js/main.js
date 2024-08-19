// main.js

import * as THREE from './lib/three.module.js';
import { GUI } from './lib/lil-gui.esm.min.js'
import Stats from './lib/stats.module.js';
import {OrbitControls} from './lib/OrbitControls.js'
import * as utils from './satellite_utils.js'
import {CSS2DRenderer, CSS2DObject} from './lib/CSS2DRenderer.js'


const App = (() => {
    let scene, camera, renderer, labelRenderer, sats = null;
    let worker;
    let stats;
    
    const textures = {day: 'day', night: null, bump: null}; // String placeholder for GUI

    // Implement sate object 
    const state = {
        sats: [],
        satPoints: null,
        satMaterial: null,
        satGeometry: null,
        globe: null,
        axesHelper: null,
        raycaster: null,
        pointer: null,
        currentlyHovered: null,
        currentlySelected: null,
        hoverTimer: null,
        controls: null
    }

    // GUI parameters
    const params = {
        globeSize: 1,
        bumpScale: 80,
        texture: textures.day,
        axes: true, //toggle helper axes
        searchTerm: ''
    }

        const satNameDiv = document.createElement('div');
        satNameDiv.className = 'label';
        satNameDiv.textContent = 'Earth';
        satNameDiv.style.backgroundColor = 'rgba(1,77,78, 0.9)'; // Dark slate gray with 90% opacity
        satNameDiv.style.color = 'white'; // White text for contrast
        satNameDiv.style.fontFamily = "'Roboto', sans-serif"; // More legible font
        satNameDiv.style.fontSize = '12px'; // Smaller font size for subtlety
        satNameDiv.style.padding = '3px 6px'; // Smaller padding for a compact look
        satNameDiv.style.borderRadius = '3px'; // Slightly rounded corners
        satNameDiv.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.7)'; // Subtle shadow for depth
        satNameDiv.style.position = 'absolute';
        satNameDiv.style.transform = 'translate(-50%, -50%)'; // Centers the label on the cursor
        const satLabel = new CSS2DObject(satNameDiv);


    function initSatLabel(){
        satLabel.position.set(1.5 * utils.EARTH_SIZE, 0, 0 );
        satLabel.center.set(0.5, 0.5);
        state.satPoints.add(satLabel);
        satLabel.layers.set(0);
        
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


        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize( window.innerWidth, window.innerHeight );
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        document.body.appendChild( labelRenderer.domElement );



        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 200, 0); // Adjust initial position as needed
        camera.up.set( 0, 0, 1 );

        // Camera controls
        //controls = new OrbitControls(camera, renderer.domElement);
        let controls = new OrbitControls( camera, labelRenderer.domElement );
        state.controls = controls; // Add to state

        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        
        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5).normalize();
        scene.add(light);
        const ambientLight = new THREE.AmbientLight(0x404040, 20); // Soft white light
        scene.add(ambientLight); 

        // Axes helper TODO: Add flag to toggle visibility
        // const axesHelper = new THREE.AxesHelper(1000);
        // state.axesHelper = axesHelper; // Add to state
        // scene.add(axesHelper);

        // Load textures
        loadTextures();

        // Globe setup
        const globeGeometry = new THREE.SphereGeometry(utils.EARTH_SIZE, 200, 100); 
        const globeMaterial = new THREE.MeshPhongMaterial({
            map: textures.day, //default texture: day
            bumpMap: textures.bump,
            bumpScale: 40
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
        // gui.add(params, 'bumpScale', 0, 200).onChange(value => {
        //     state.globe.material.bumpScale = value;
        //     state.globe.material.needsUpdate = true;});
        // gui.add(params, 'axes').onChange(function(){
        //     state.axesHelper.visible = !state.axesHelper.visible;
        // })
        // just add the string search
        gui.add(params, 'searchTerm');
    }

    function initStats(fps=true, ms=true, mb=true) {
        if (!fps && !ms && !mb) return null;
        let return_obj = {fps: null, ms: null, mb: null};

        if(fps){
            const statsFPS = new Stats();
            statsFPS.showPanel(0); // Panel 0 = fps
            statsFPS.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
            document.body.appendChild(statsFPS.domElement);
            return_obj.fps = statsFPS;
        }

        if(ms){
            const statsMS = new Stats();
            statsMS.showPanel(1); // Panel 1 = ms
            statsMS.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
            document.body.appendChild(statsMS.domElement);
            return_obj.ms = statsMS;
        }
   

        if(mb){
            const statsMB = new Stats();
            statsMB.showPanel(2); // Panel 2 = mb
            statsMB.domElement.style.cssText = 'position:absolute;top:0px;left:160px;';
            document.body.appendChild(statsMB.domElement);
            return_obj.mb = statsMB;
        }

     

        return return_obj;
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
                uniforms: { 
                    size: { value: 1 },
                    selectedIndex: { value: -1 }, // Add uniform for selected satellite index
                    alpha: { value: 0.8 }
                },
                vertexShader: utils.vertexShader,
                fragmentShader: utils.fragmentShader,
                transparent: true
            });
            state.satMaterial = satMaterial; // Add to state

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

                // Update the state.sats array with the new positions
                for (let i = 0; i < sats.length; i++) {
                    sats[i].position = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                }
            };

            initSatLabel(); // Initialize satellite label now that satPoints is defined

        } catch (error) {
            console.error('Error fetching satellite data:', error);
        }
    }


    function initRaycaster() {
        const raycaster = new THREE.Raycaster();
        state.raycaster = raycaster; // Add to state
        raycaster.params.Points.threshold = 0.3;
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
        const intersects = state.raycaster.intersectObjects([state.globe, state.satPoints]);

        if (intersects.length > 0) {
            const intersected = intersects[0];
            if (intersected.object === state.globe) {
                state.currentlyHovered = null;
                return null;
            }
            const satIndex = intersected.index;
            // console.log(Hovered Satellite: ${state.sats[satIndex]['OBJECT_NAME']} | ${state.sats[satIndex]['NORAD_CAT_ID']});
            
            return intersected;
        }
        else { 
            return null;
        }
    }


    function hoverThreshold(currentlyHovered, seconds = 0.01) {
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
            //state.currentlySelected = currentlyHovered;
            state.currentlyHovered = currentlyHovered;
            return true;
        }
        return false;
    }


    /**
     * Adjusts the position of a label to appear consistently above the cursor in 3D space.
     * This function converts the label's world position to Normalized Device Coordinates (NDC),
     * applies a vertical offset in screen space, and then converts it back to world coordinates.
     * The offset ensures that the label is displayed above the cursor, independent of camera angle or distance.
     *
     * @param {THREE.Vector3} worldPosition - The original world position of the label.
     * @param {THREE.Camera} camera - The camera used in the scene.
     * @param {THREE.Renderer} renderer - The renderer used for drawing the scene.
     * @param {number} offsetPixels - The number of pixels to offset the label above the cursor.
     * @returns {THREE.Vector3} - The new world position of the label, adjusted to be above the cursor.
     */
    function adjustLabelAboveCursor(worldPosition, camera, renderer, offsetPixels = 30) {
        // Convert world position to normalized device coordinate (NDC) space
        const ndcPosition = worldPosition.clone().project(camera);
    
        // Adjust the y-coordinate in NDC space (NDC space ranges from -1 to 1 in both x and y)
        ndcPosition.y += offsetPixels / (renderer.domElement.height / 2); // Converts pixel offset to NDC units
    
        // Convert back from NDC to world space
        const newWorldPosition = ndcPosition.unproject(camera);
    
        return newWorldPosition;
    }
    

    function displayHoveredLabel(satIndex){
        // If already selected, don't display hover label
        if (state.currentlySelected !== null && state.currentlySelected.index === satIndex){
            return
        }

        const originalPosition = new THREE.Vector3(
            state.currentlyHovered.point.x,
            state.currentlyHovered.point.y,
            state.currentlyHovered.point.z
        );
    
        // Get adjusted position above cursor
        const adjustedPosition = adjustLabelAboveCursor(originalPosition, camera, renderer);
    
        // Update the label's position
        satLabel.element.textContent = `${state.sats[satIndex]['OBJECT_NAME']} [${state.sats[satIndex]['NORAD_CAT_ID']}]`;
        satLabel.position.copy(adjustedPosition);
    }

    
    function displaySelectedLabel(){
        // Update selected satellite position
        state.currentlySelected.point = state.sats[state.currentlySelected.index].position;

        const originalPosition = new THREE.Vector3(
            state.currentlySelected.point.x,
            state.currentlySelected.point.y,
            state.currentlySelected.point.z
        );

        // Get adjusted position above cursor
        const adjustedPosition = adjustLabelAboveCursor(originalPosition, camera, renderer, 50);
    
        // Pass the selected satellite index to the shader
        state.satMaterial.uniforms.selectedIndex.value = state.currentlySelected.index;

        // Update the label's position
        satLabel.element.textContent = `${state.sats[state.currentlySelected.index]['OBJECT_NAME']} [${state.sats[state.currentlySelected.index]['NORAD_CAT_ID']}]`;
        satLabel.position.copy(adjustedPosition);
    }


    function clearSatelliteInfo() {
        const infoPanel = document.getElementById('satelliteInfoPanel');
        
        // Clear the content
        infoPanel.innerHTML = '';
    
        // Optionally hide the panel if you want it to be invisible when no satellite is selected
        infoPanel.style.display = 'none';
    }


    function displaySelectedInfo() {
        if (state.currentlySelected) {
            const satellite = state.sats[state.currentlySelected.index];
    
            // Get the info panel div
            const infoPanel = document.getElementById('satelliteInfoPanel');
    
            // Clear any existing content
            infoPanel.innerHTML = '';
            //make the panel visible
            infoPanel.style.display = 'block';
    
            // Helper function to create info fields
            function createInfoField(label, value) {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'info-field';
    
                const labelSpan = document.createElement('span');
                labelSpan.className = 'info-label';
                labelSpan.textContent = `${label}:`;
    
                const valueSpan = document.createElement('span');
                valueSpan.className = 'info-value';
                valueSpan.textContent = value;
    
                fieldDiv.appendChild(labelSpan);
                fieldDiv.appendChild(valueSpan);
    
                return fieldDiv;
            }
    
            // 1. Basic Identification
            const nameAndNorad = `${satellite.OBJECT_NAME} [${satellite.NORAD_CAT_ID}]`;
    
            // Deduce Object Type
            let objectType = 'Unknown';
            switch (satellite.OBJECT_TYPE) {
                case 'PAYLOAD':
                    objectType = 'Payload';
                    break;
                case 'ROCKET BODY':
                    objectType = 'Rocket Body';
                    break;
                case 'DEBRIS':
                    objectType = 'Debris';
                    break;
            }
    
            // Format the launch date as "YYYY MM DD"
            let formattedLaunchDate = 'Unknown';
            if (satellite.LAUNCH_DATE) {
                const date = new Date(satellite.LAUNCH_DATE);
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                formattedLaunchDate = date.toLocaleDateString('en-US', options);    
            }
    
            // 2. Orbital Characteristics
            // Orbit Type Deduction (simplified example)
            let orbitType = 'Unknown Orbit';
            const periapsis = parseFloat(satellite.PERIAPSIS);
            const apoapsis = parseFloat(satellite.APOAPSIS);
            const apsides = `${Math.round(periapsis)} km / ${Math.round(apoapsis)} km`;
    

            const eccentricity = parseFloat(satellite.ECCENTRICITY);
            
            if (apoapsis >= 35786 && periapsis >= 35786 && eccentricity < 0.01) {
                orbitType = 'Geostationary Orbit (GEO)';
            } else if (apoapsis >= 35786 && periapsis < 35786) {
                orbitType = 'Geosynchronous Orbit (GSO)';
            } else if (apoapsis >= 2000 && apoapsis < 35786 && periapsis >= 2000 && periapsis < 35786) {
                orbitType = 'Medium Earth Orbit (MEO)';
            } else if (apoapsis >= 160 && apoapsis < 2000 && periapsis >= 160 && periapsis < 2000) {
                orbitType = 'Low Earth Orbit (LEO)';
            } else if (apoapsis >= 100 && apoapsis < 160 && periapsis >= 100 && periapsis < 160) {
                orbitType = 'Very Low Earth Orbit (VLEO)';
            } else if (apoapsis >= 35786 && periapsis >= 160 && periapsis < 2000) {
                orbitType = 'Highly Elliptical Orbit (HEO)';
            } else if (apoapsis < 160) {
                orbitType = 'Suborbital';
            } else {
                orbitType = 'Unknown Orbit';
            }
    
            // Convert period from minutes to days, hours, and minutes
            const periodMinutes = parseFloat(satellite.PERIOD);
            const periodDays = Math.floor(periodMinutes / (24 * 60));
            const periodHours = Math.floor((periodMinutes % (24 * 60)) / 60);
            const periodMins = Math.floor(periodMinutes % 60);
            const periodFormatted = 
                `${periodDays > 0 ? periodDays + ' days ' : ''}${periodHours > 0 ? periodHours + ' hours ' : ''}${periodMins} minutes`;
    
            // Add fields to the info panel
            infoPanel.appendChild(createInfoField('Name and ID', nameAndNorad));
            infoPanel.appendChild(createInfoField('Object Type', objectType));
            if(satellite.COUNTRY_CODE){
                infoPanel.appendChild(createInfoField('Country', `${satellite.COUNTRY_CODE}`));
            }
            if(satellite.LAUNCH_DATE){
                infoPanel.appendChild(createInfoField('Launch Date', formattedLaunchDate));
            }
            infoPanel.appendChild(createInfoField('Orbit Type', orbitType));
            infoPanel.appendChild(createInfoField('Inclination', `${satellite.INCLINATION}°`));
            infoPanel.appendChild(createInfoField('Apsides', `${apsides}`));
            infoPanel.appendChild(createInfoField('Orbital Period', periodFormatted));
            if (satellite.DECAY_DATE) {
                infoPanel.appendChild(createInfoField('Decay Date', satellite.DECAY_DATE));
            }
    
            // You can continue adding more fields here as needed
        }
    }
    
    
    /**
     * Smoothly transitions the camera to focus on a newly selected satellite.
     * 
     * Achieves this by:
     * - Calculating a new camera position at a fixed distance from the satellite.
     * - Simultaneously animating the camera's position and orbit controls' target 
     *   using a GSAP timeline, ensuring both movements happen in sync without jumps.
     */
    function moveCameraToSatellite() {
        if (state.currentlySelected) {

            const transitionConfig = {
                distance: 10, // Distance from the satellite during the transition (adjust as needed)
                duration: 1.5, // Combined duration for both rotation and translation
                easing: "power2.inOut", // Easing function for a smooth transition
            };

            const targetSatellite = state.sats[state.currentlySelected.index];
            const satellitePosition = targetSatellite.position.clone();
    
            // Calculate the vector from the Earth's center to the satellite
            const directionFromEarth = new THREE.Vector3()
                .subVectors(satellitePosition, new THREE.Vector3(0, 0, 0))
                .normalize();
    
            // Set the camera's new position by moving away from the satellite along this vector
            const newCameraPosition = satellitePosition
                .clone()
                .add(directionFromEarth.multiplyScalar(transitionConfig.distance));
    
            // Disable controls during animation
            state.controls.enabled = false;
    
            // Store the original positions
            const originalCameraPosition = camera.position.clone();
            const originalControlsTarget = state.controls.target.clone();
    
            // Create objects to animate controls target and camera position
            const animationTargets = {
                controlX: originalControlsTarget.x,
                controlY: originalControlsTarget.y,
                controlZ: originalControlsTarget.z,
                camX: originalCameraPosition.x,
                camY: originalCameraPosition.y,
                camZ: originalCameraPosition.z,
            };
    
            // GSAP timeline for synchronized animations
            const tl = gsap.timeline({
                onComplete: () => {
                    // Re-enable controls after the animation
                    state.controls.enabled = true;
                    state.controls.update(); // Ensure the controls are fully updated after animation
                },
            });
    
            // Animate controls target and camera position together in one smooth motion
            tl.to(animationTargets, {
                duration: transitionConfig.duration,
                controlX: satellitePosition.x,
                controlY: satellitePosition.y,
                controlZ: satellitePosition.z,
                camX: newCameraPosition.x,
                camY: newCameraPosition.y,
                camZ: newCameraPosition.z,
                ease: transitionConfig.easing,
                onUpdate: () => {
                    state.controls.target.set(
                        animationTargets.controlX,
                        animationTargets.controlY,
                        animationTargets.controlZ
                    );
                    camera.position.set(
                        animationTargets.camX,
                        animationTargets.camY,
                        animationTargets.camZ
                    );
                    camera.lookAt(state.controls.target);
                },
            });
        }
    }
    

    function recenterCameraToEarth() {
        const transitionConfig = {
            distance: 120, // Adjust this to set how far the camera should be from Earth
            duration: 1.5, // Duration of the transition back to Earth
            easing: "power2.inOut", // Easing function for a smooth transition
        };
    
        const earthPosition = new THREE.Vector3(0, 0, 0);
    
        // Disable controls during animation
        state.controls.enabled = false;
    
        // Store the original camera position and controls target
        const originalCameraPosition = camera.position.clone();
        const originalControlsTarget = state.controls.target.clone();
    
        // Create objects to animate controls target and camera position
        const animationTargets = {
            controlX: originalControlsTarget.x,
            controlY: originalControlsTarget.y,
            controlZ: originalControlsTarget.z,
            camX: originalCameraPosition.x,
            camY: originalCameraPosition.y,
            camZ: originalCameraPosition.z,
        };
    
        // New camera position, pulling back from the Earth's center
        const newCameraPosition = new THREE.Vector3(
            0,
            transitionConfig.distance,
            0
        );
    
        // GSAP timeline for synchronized animations
        const tl = gsap.timeline({
            onComplete: () => {
                // Re-enable controls after the animation
                state.controls.enabled = true;
                state.controls.update(); // Ensure the controls are fully updated after animation
            },
        });
    
        // Animate controls target and camera position back to Earth
        tl.to(animationTargets, {
            duration: transitionConfig.duration,
            controlX: earthPosition.x,
            controlY: earthPosition.y,
            controlZ: earthPosition.z,
            camX: newCameraPosition.x,
            camY: newCameraPosition.y,
            camZ: newCameraPosition.z,
            ease: transitionConfig.easing,
            onUpdate: () => {
                state.controls.target.set(
                    animationTargets.controlX,
                    animationTargets.controlY,
                    animationTargets.controlZ
                );
                camera.position.set(
                    animationTargets.camX,
                    animationTargets.camY,
                    animationTargets.camZ
                );
                camera.lookAt(state.controls.target);
            },
        });
    }
    

    function initEventListeners() {
        // Window resize listener
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Satellite selection
        document.addEventListener('pointerdown', () => {
            if (state.currentlyHovered) {
                state.currentlySelected = state.currentlyHovered;
                moveCameraToSatellite();
            }
        });

        // Escape key listener to clear selection and recenter camera
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                state.currentlySelected = null; // Clear the selected satellite
                clearSatelliteInfo(); // Clear the satellite information panel
                recenterCameraToEarth(); // Recenter the camera to the Earth
                satNameDiv.style.visibility = 'hidden'; // Hide the label if any

                state.satMaterial.uniforms.selectedIndex.value = -1;
                state.satMaterial.needsUpdate = true;
            }
        });
    }

    const filterByName = (name) => (satellite) => {
        if (!name) {
            return true; // Return true to include the satellite in the results if name is null or empty
        }
        return satellite.OBJECT_NAME.toLowerCase().includes(name.toLowerCase());
    };
    
    const filterByApogee = (minApogee) => (satellite) =>
        satellite.APOGEE >= minApogee;
    
    const filterByPerigee = (minPerigee) => (satellite) =>
        satellite.PERIGEE >= minPerigee;
    
    const filterByCountry = (country) => (satellite) =>
        satellite.COUNTRY_CODE === country;

    const applyFilters = (satellites, filters) => {
        return satellites.filter(satellite => filters.every(filter => filter(satellite)));
    };


    function updateSatelliteGeometry(satellites) {
        const satGeometry = state.satPoints.geometry;
        const positions = satGeometry.attributes.position.array;
        const allIndices = new Set([...Array(positions.length / 3).keys()]); // Set of all indices
        const filteredIndices = new Set(satellites.map(sat => sat.index)); // Set of filtered indices
    
        allIndices.forEach(i => {
            if (!filteredIndices.has(i)) {
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
            }
        });
    
        // Update the positions of the filtered satellites
        satellites.forEach((sat) => {
            const posIdx = sat.index * 3;
            const positionEcf = sat.position;
            if (positionEcf && !isNaN(positionEcf.x) && !isNaN(positionEcf.y) && !isNaN(positionEcf.z)) {
                positions[posIdx] = positionEcf.x 
                positions[posIdx + 1] = positionEcf.y 
                positions[posIdx + 2] = positionEcf.z 
            }
        });
    
        satGeometry.attributes.position.needsUpdate = true;
        satGeometry.computeBoundingSphere();
    }
    
    


    // Function for the rendering loop
    function tick() {
        //Object.values(stats).forEach(stat => stat.begin()); //Begin stats monitoring
        // change to for each stat that isnt null:
        Object.values(stats).forEach(stat => {
            if (stat !== null){
                stat.begin();
            }
        })

        requestAnimationFrame(tick);

        // Get latest satellite positions from worker
        let positions = new Float32Array(state.satPoints.geometry.attributes.position.array); // Causing a memory leak
        worker.postMessage({ type: 'update', epoch: new Date(), buffer: positions.buffer }, [positions.buffer]);


        // Call updateSatelliteGeometry with the filtered satellites
        const filteredSatellites =  applyFilters(sats, [filterByName(params.searchTerm)]);
        updateSatelliteGeometry(filteredSatellites);

        // Raycaster
        let currentlyHovered = raycasterIntersect();
        if (state.currentlySelected){
            displaySelectedLabel();
            displaySelectedInfo();
        }
        if (currentlyHovered && hoverThreshold(currentlyHovered) ){
            satNameDiv.style.visibility = 'visible'; 

            displayHoveredLabel(currentlyHovered.index);
        }
        else if (currentlyHovered === null && !state.currentlySelected) {
            satNameDiv.style.visibility = 'hidden'; 
            state.currentlyHovered = null;
        } 

        // Selected satellite


        state.controls.update();

        renderer.render(scene, camera);
        labelRenderer.render( scene, camera );


        // Update camera position in <div id="cameraPosition">Camera Position: </div>
        const cameraPosition = document.getElementById('cameraPosition');
        cameraPosition.innerHTML = `Camera Position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`;


        Object.values(stats).forEach(stat => {
            if (stat !== null){
                stat.end();
            }
        }) //End stats monitoring
    }


    // Accessible functions
    return {
        init: function() {
            const timestamp = performance.now();
            loadTextures();
            initScene();
            initRaycaster();
            initGUI();
            stats = initStats(true, false, false);
            initEventListeners();
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