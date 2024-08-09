// satelliteWorker.js

import * as sat_utils from './satellite_utils.js';


let sats = [];

onmessage = function(e) {
    if (e.data.type === 'initialize') {
        sats = e.data.sats;
    } else if (e.data.type === 'update') {
        const { epoch, buffer } = e.data;
        const updatedSats = sat_utils.propagateAllSatellites(sats, epoch);

        let positions = new Float32Array(buffer);
        for (let i = 0; i < updatedSats.length; i++) {
            let positionEcf = updatedSats[i].position;
            if (positionEcf) {
                positions[i * 3] = positionEcf.x / sat_utils.SCALE_FACTOR;
                positions[i * 3 + 1] = positionEcf.y / sat_utils.SCALE_FACTOR;
                positions[i * 3 + 2] = positionEcf.z / sat_utils.SCALE_FACTOR;
            }
        }

        postMessage({ buffer: positions.buffer }, [positions.buffer]);
    }
};