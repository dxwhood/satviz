import * as satjs from './lib/satellite.es.js';

const SCALE_FACTOR = 1274; // divide km by this to get units in 3D space


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
            sats[i]['position'] = (0,0,0); // or some default valid position
        }
    }
    return sats;
}


export function updateSatellitePositions(geometry, satellites) {

    let positions = geometry.attributes.position.array;

    // Assuming the positions have already been updated in the satellites array
    for (let i = 0; i < satellites.length; i++) {
        let positionEcf = satellites[i].position;
        
        if (positionEcf) {
            positions[i * 3] = positionEcf.x/SCALE_FACTOR;
            positions[i * 3 + 1] = positionEcf.y/SCALE_FACTOR;
            positions[i * 3 + 2] = positionEcf.z/SCALE_FACTOR;
        }
    }

    geometry.attributes.position.needsUpdate = true; // Mark the attribute for update
}


export function propagateAndUpdate(sats, geometry, epoch = new Date()) {
    propagateAllSatellites(sats, epoch)
    updateSatellitePositions(geometry, sats)
    return sats;
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