import * as satjs from './lib/satellite.es.js';


// const positionAndVelocity = sgp4(0, 0);

// // URL to the JSON file
// const url = '../data/ST_gp_data.json';

export function satTest(data){
    console.log(data[1]);
}


export function excract_TLE(gp_data){
    let tle = []
    for (let i = 0; i < gp_data.length; i++) {
        let obj = {}
        obj['TLE_LINE0'] = gp_data[i].TLE_LINE0;
        obj['TLE_LINE1'] = gp_data[i].TLE_LINE1;
        obj['TLE_LINE2'] = gp_data[i].TLE_LINE2;
        obj['satrec'] = satjs.twoline2satrec(gp_data[i].TLE_LINE1, gp_data[i].TLE_LINE2)
        tle.push(obj);
    }
    return tle;
}

export function get_sat_ecef(sat_obj, epoch=null){
    if (epoch === null){
        epoch = new Date();
    }
    let positionAndVelocity = satjs.propagate(sat_obj.satrec, epoch);
    let positionEci = positionAndVelocity.position;
    let gmst = satjs.gstime(epoch)
    return satjs.eciToEcf(positionEci, gmst)
}