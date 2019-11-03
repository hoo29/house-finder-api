import mongoose from 'mongoose';
import { IsochroneRequest, IsochroneCacheModel, IsochroneResult } from './database.model';

export async function connect(url: string) {
    console.debug('db connecting');
    await mongoose.connect(url, { useNewUrlParser: true });

    process.on('SIGINT', handleClose);
    process.on('SIGTERM', handleClose);
    console.debug('db connected');
}

export async function checkCache(query: IsochroneRequest): Promise<null | IsochroneCacheModel> {
    const results = await IsochroneCacheModel.findOne(query).exec();

    return results;
}

export async function updateCache(results: IsochroneResult) {
    await new IsochroneCacheModel(results).save();
}

function handleClose() {
    mongoose.disconnect().catch(error => console.error('mongoose disconnection error ', error));
}
