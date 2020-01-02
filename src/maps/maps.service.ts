import rp from 'request-promise-native';
import { IsochroneRequest } from '../database/database.model';

const setTimeoutProm = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout));

function checkForErrors(res: any) {
    if (typeof res.errorDetails !== 'undefined') {
        console.error('there was an error', res.errorDetails);
        throw new Error(`there was an error ${res.errorDetails}`);
    }

    if (!res.resourceSets[0].resources[0].isAccepted) {
        console.error('request not accepted by bing maps', res.resourceSets[0].resources[0]);
        throw new Error('request not accepted by bing maps');
    }
}

async function pollAsync(res: any) {
    checkForErrors(res);
    let done = false;
    while (!done) {
        const callBackUrl = res.resourceSets[0].resources[0].callbackUrl;
        const timeOut = res.resourceSets[0].resources[0].callbackInSeconds * 1000;
        console.debug('waiting', timeOut);
        await setTimeoutProm(timeOut);
        console.debug('getting next async result');
        res = await rp.get(callBackUrl, { json: true });
        checkForErrors(res);
        done = res.resourceSets[0].resources[0].isCompleted;
    }
    return res.resourceSets[0].resources[0].resultUrl;
}

export async function getIsochrone(query: IsochroneRequest, bingMapsKey: string) {
    const isoAsyncRes = await rp.get('https://dev.virtualearth.net/REST/v1/Routes/IsochronesAsync', {
        qs: {
            ...query,
            key: bingMapsKey,
        },
        json: true,
    });

    console.debug('waiting for results to be ready');
    const resUrl = await pollAsync(isoAsyncRes);
    console.debug('getting results');
    const results = await rp.get(resUrl, { json: true });
    const polyData = results.resourceSets[0].resources[0].polygons;
    if (typeof polyData === 'undefined') {
        console.error('error in results', results.resourceSets[0].resources[0].errorMessage);
        throw new Error(`error in results: ${results.resourceSets[0].resources[0].errorMessage}`);
    }
    console.debug('got results');
    return polyData;
}
