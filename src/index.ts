import { APIGatewayEvent } from 'aws-lambda';

import { connect, checkCache, updateCache } from './database/database.service';
import { getIsochrone } from './maps/maps.service';

connect(process.env.DATABASE_URL!)
    .then(() => console.info('database connected'))
    .catch((error: Error) => {
        console.error('database connection failed', error);
        process.exit(1);
    });

export const handler = async (event: APIGatewayEvent) => {
    const body = JSON.parse(event.body!);
    const found = await checkCache(body);
    if (found != null) {
        return found.polygonResults;
    } else {
        const results = await getIsochrone(body);
        await updateCache({ ...body, polygonResults: results });
        return results;
    }
};
