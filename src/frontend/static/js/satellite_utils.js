//sat_utils.js

import * as satjs from './lib/satellite.es.js';
import * as THREE from './lib/three.module.js';


const SCALE_FACTOR = 1274; // divide km by this to get units in 3D space

// const positionAndVelocity = sgp4(0, 0);

// // URL to the JSON file
// const url = '../data/ST_gp_data.json';

export function satTest(data){
    console.log(data[1]);
}


export function extend_sat_objects(gp_data){
    for (let i = 0; i < gp_data.length; i++) {
        gp_data[i]['satrec'] = satjs.twoline2satrec(gp_data[i].TLE_LINE1, gp_data[i].TLE_LINE2);
        gp_data[i]['position'] = get_sat_ecef(gp_data[i]);
        gp_data[i]['index'] = i;
    }
    return gp_data;
}


export function propagateAllSatellites(sats, epoch = new Date()) {
    for (let i = 0; i < sats.length; i++) {
        const position = get_sat_ecef(sats[i], epoch);
        if (isFinite(position.x) && isFinite(position.y) && isFinite(position.z)) {
            sats[i]['position'] = position;
        } else {
            sats[i]['position'] = (0,0,0); 
        }
    }
    return sats;
}

export function updateSatellitePositions(satInstancedMesh, satellites) {
    const dummy = new THREE.Object3D();
    console.log(`satellites length: ${satellites.length}`);

    for (let i = 0; i < satellites.length; i++) {
        let positionEcf = satellites[i].position;
        if (positionEcf) {
            dummy.position.set(positionEcf.x / SCALE_FACTOR, positionEcf.y /SCALE_FACTOR, positionEcf.z /SCALE_FACTOR);
            dummy.updateMatrix();

            satInstancedMesh.setMatrixAt(i, dummy.matrix);

        }
    }

    satInstancedMesh.instanceMatrix.needsUpdate = true;
}


export function get_sat_ecef(sat, epoch=null){
    if (epoch === null){
        epoch = new Date();
    }
    let positionAndVelocity = satjs.propagate(sat.satrec, epoch);
    let positionEci = positionAndVelocity.position;
    //if undefined set to 0,0,0
    if (positionEci === undefined){
        positionEci = {x: 0, y: 0, z: 0};
    }
    let gmst = satjs.gstime(epoch)
    return satjs.eciToEcf(positionEci, gmst)
}