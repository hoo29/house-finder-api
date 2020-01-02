import { APIGatewayEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { connect, updateCache } from './database/database.service';
import { getIsochrone, getPointsFromPostCode } from './maps/maps.service';
import { IsochroneRequest, LocationRequest } from './database/database.model';
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

    const headers = {
        'Access-Control-Allow-Origin': '*',
    };

    try {
        const data = await handleRequest(event);
        return {
            headers,
            body: JSON.stringify(data),
            statusCode: 200,
            isBase64Encoded: false,
        };
    } catch (error) {
        console.error('something went wrong', error);
        return {
            headers,
            body: JSON.stringify({ error: 'something went a bit wrong' }),
            statusCode: 500,
            isBase64Encoded: false,
        };
    }
}

async function handleRequest(event: APIGatewayEvent) {
    switch (event.httpMethod.toLowerCase()) {
        case 'post':
            return handlePost(event);
        default:
            throw new Error(`unsupported operation ${event.httpMethod.toLowerCase()}`);
    }
}

async function handlePost(event: APIGatewayEvent) {
    switch (event.path) {
        case '/hsapi/isochrone':
            return handleIsoRequest(event);
        case '/hsapi/loc':
            return handleIsoRequest(event);
        default:
            throw new Error(`unsupported path ${event.path}`);
    }
}

async function handleLocRequest(event: APIGatewayEvent) {
    const request = JSON.parse(event.body!) as LocationRequest;
    const results = await getPointsFromPostCode(request, getPsConfig().BING_MAPS_KEY);
    return results;
}

async function handleIsoRequest(event: APIGatewayEvent) {
    const request = JSON.parse(event.body!) as IsochroneRequest;
    const results = await getIsochrone(request, getPsConfig().BING_MAPS_KEY);
    if (request.cache) {
        await updateCache({ ...request, polygonResults: results, user: 'me' });
    }

    return results;
}
