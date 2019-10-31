import { Schema, model, Document } from 'mongoose';

enum TRAVEL_MODES {
    driving,
    walking,
    transit,
}

export interface IsochroneRequest {
    waypoint: string;
    maxTime: number;
    travelMode: TRAVEL_MODES;
    maxDistance?: string;
}
export interface IsochroneResult extends IsochroneRequest {
    polygonResults: any[];
}

export interface IsochroneCacheModel extends Document, IsochroneResult {}

const cacheSchema = new Schema({
    waypoint: {
        type: String,
        required: true,
    },
    maxTime: { type: Number, required: true },
    travelMode: {
        type: String,
        enum: ['driving', 'walking', 'transit'],
        required: true,
    },
    maxDistance: {
        type: String,
    },
    polygonResults: { type: [], required: true },
});

cacheSchema.index({ waypoint: 1, maxTime: 1, travelMode: 1, maxDistance: 1 });

export const IsochroneCacheModel = model<IsochroneCacheModel>('isochrones', cacheSchema);
