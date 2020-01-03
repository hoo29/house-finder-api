import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

import {
    connect,
    updateIsoCache,
    checkLocationCache,
    updateLocCache,
    checkIsoCache,
} from './database/database.service';
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

    console.debug('new request', event);

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
            return handleLocRequest(event);
        default:
            throw new Error(`unsupported path ${event.path}`);
    }
}
async function handleIsoRequest(event: APIGatewayEvent) {
    const request = JSON.parse(event.body!) as IsochroneRequest;
    console.debug('checking cache for iso', request);
    const cache = await checkIsoCache(request);
    if (cache !== null) {
        console.debug('cache hit');
        return cache.toObject({ versionKey: false });
    } else {
        console.debug('cache miss');
        const results = await getIsochrone(request, getPsConfig().BING_MAPS_KEY);
        await updateIsoCache({ ...request, polygonResults: results });
        console.debug('cache updated');
        return { polygonResults: results };
    }
}

async function handleLocRequest(event: APIGatewayEvent) {
    const request = JSON.parse(event.body!) as LocationRequest;
    console.debug('checking cache for location', request);
    const cache = await checkLocationCache(request);
    if (cache !== null) {
        console.debug('cache hit');
        return cache.toObject({ versionKey: false });
    } else {
        console.debug('cache miss');
        const results = await getPointsFromPostCode(request, getPsConfig().BING_MAPS_KEY);
        await updateLocCache({ postcode: request.postcode, point: results });
        console.debug('cache updated');
        return results;
    }
}
