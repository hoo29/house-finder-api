import { APIGatewayEvent } from 'aws-lambda';

import { connect, updateCache } from './database/database.service';
import { getIsochrone } from './maps/maps.service';
import { IsochroneRequest } from './database/database.model';
import { loadPsConfig, getPsConfig } from './config.manager';

loadPsConfig(process.env.PS_PATH)
    .then(() => connect(getPsConfig().DATABASE_URL))
    .catch((error: Error) => {
        console.error('init failed', error);
        process.exit(1);
    });

export async function handler(event: APIGatewayEvent) {
    const request = JSON.parse(event.body!) as IsochroneRequest;
    switch (event.httpMethod.toLowerCase()) {
        case 'post':
            return handlePost(request);
        default:
            throw new Error(`unsupported operation ${event.httpMethod.toLowerCase()}`);
    }
}

async function handlePost(request: IsochroneRequest) {
    const results = await getIsochrone(request, getPsConfig().BING_MAPS_KEY);
    if (request.cache) {
        await updateCache({ ...request, polygonResults: results, user: 'me' });
    }

    return results;
}
