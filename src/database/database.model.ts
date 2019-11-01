import { Schema, model, Document } from 'mongoose';

enum TRAVEL_MODES {
    driving,
    walking,
    transit,
}

enum OPTIMIZE_MODES {
    distance,
    time,
    timeWithTraffic,
}

export interface IsochroneRequest {
    waypoint: string;
    maxTime: number;
    maxDistance?: string;
    dateTime?: number;
    optimize?: OPTIMIZE_MODES;
    travelMode: TRAVEL_MODES;
    cache: boolean;
}

export interface IsochroneResult extends IsochroneRequest {
    polygonResults: any[];
    user: string;
}

export interface IsochroneCacheModel extends Document, IsochroneResult {}

const cacheSchema = new Schema({
    waypoint: {
        type: String,
        required: true,
    },
    maxTime: { type: Number, required: true },
    maxDistance: {
        type: Number,
    },
    dateTime: {
        type: Number,
        required: true,
    },
    optimize: {
        type: String,
        enum: ['distance', 'time', 'timeWithTraffic'],
    },
    travelMode: {
        type: String,
        enum: ['driving', 'walking', 'transit'],
        required: true,
    },
    user: {
        type: String,
        index: true,
        required: true,
    },
    polygonResults: { type: [], required: true },
});

export const IsochroneCacheModel = model<IsochroneCacheModel>('isochrones', cacheSchema);
