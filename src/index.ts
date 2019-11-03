import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { connect, updateCache } from './database/database.service';
import { getIsochrone } from './maps/maps.service';
import { IsochroneRequest } from './database/database.model';
import { loadPsConfig, getPsConfig, checkPsConfig } from './config.manager';
import { connection } from 'mongoose';

loadPsConfig(process.env.PS_PATH)
    .then(() => connect(getPsConfig().DATABASE_URL))
    .catch((error: Error) => {
        console.error('init failed', error);
        process.exit(1);
    });

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    while (!checkPsConfig() || connection.readyState !== 1) {
        console.debug('config or db not loaded, waiting...');
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    try {
        const data = await handleRequest(event);
        return {
            body: data,
            statusCode: 200,
            isBase64Encoded: false,
        };
    } catch (error) {
        console.error('something went wrong', error);
        return {
            body: 'something went a bit wrong',
            statusCode: 500,
            isBase64Encoded: false,
        };
    }
}

async function handleRequest(event: APIGatewayEvent) {
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
