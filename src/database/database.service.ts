import mongoose from 'mongoose';
import {
    IsochroneRequest,
    IsochroneCacheModel,
    IsochroneResult,
    LocationRequest,
    LocationCacheModel,
    LocationResult,
} from './database.model';

export async function connect(url: string) {
    console.debug('db connecting');
    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    });

    process.on('SIGINT', handleClose);
    process.on('SIGTERM', handleClose);
    console.debug('db connected');
}

export async function checkIsoCache(query: IsochroneRequest): Promise<null | IsochroneCacheModel> {
    const results = await IsochroneCacheModel.findOne(query).exec();

    return results;
}

export async function updateIsoCache(results: IsochroneResult) {
    await new IsochroneCacheModel(results).save();
}

export async function checkLocationCache(query: LocationRequest): Promise<null | LocationCacheModel> {
    const results = await LocationCacheModel.findOne(query).exec();

    return results;
}

export async function updateLocCache(results: LocationResult) {
    await new LocationCacheModel(results).save();
}

function handleClose() {
    mongoose.disconnect().catch(error => console.error('mongoose disconnection error ', error));
}
