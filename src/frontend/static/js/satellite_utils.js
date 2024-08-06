import * as satjs from './lib/satellite.es.js';

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


export function propagateAllSatellites(sats, epoch=new(Date)){
    console.log(`in propagateAllSatellites - epoch ${epoch}`);
    for(let i=0; i < sats.length; i++){
        sats[i]['position'] = get_sat_ecef(sats[i].satrec, epoch);
    }
    return sats;
}

// Update Function
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

export function get_sat_ecef(satrec, epoch=null){
    if (epoch === null){
        epoch = new Date();
    }
    console.log(`in get_sat_ecef`)
    console.log(satrec)
    let positionAndVelocity = satjs.propagate(satrec, epoch);
    let positionEci = positionAndVelocity.position;
    let gmst = satjs.gstime(epoch)
    return satjs.eciToEcf(positionEci, gmst)
}