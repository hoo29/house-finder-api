import { Schema, model, Document } from 'mongoose';

enum TRAVEL_MODES {
    driving = 'driving',
    walking = 'walking',
    transit = 'walking',
}

enum OPTIMIZE_MODES {
    distance = 'distance',
    time = 'time',
    timeWithTraffic = 'timeWithTraffic',
}

enum TIME_UNITS {
    minute = 'minute',
    second = 'second',
}

enum DISTANCE_UNITS {
    mi = 'mi',
    km = 'km',
}

export interface LocationRequest {
    postcode: string;
}

export interface LocationResult extends LocationRequest {
    point: number[];
}

export interface LocationCacheModel extends Document, LocationRequest {}

const locationSchema = new Schema({
    postcode: {
        type: String,
        required: true,
        index: true,
    },
    point: {
        type: Array,
        required: true,
    },
});

export interface IsochroneRequest {
    waypoint: string;
    maxTime?: number;
    timeUnit?: TIME_UNITS;
    maxDistance?: number;
    distanceUnit?: DISTANCE_UNITS;
    dateTime?: string;
    optimize?: OPTIMIZE_MODES;
    travelMode: TRAVEL_MODES;
    cache: boolean;
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
    maxTime: { type: Number },
    timeUnit: {
        type: String,
        enum: ['minute', 'second'],
    },
    maxDistance: {
        type: Number,
    },
    distanceUnit: {
        type: String,
        enum: ['mi', 'km'],
    },
    dateTime: {
        type: Date,
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
    polygonResults: { type: [], required: true },
});

cacheSchema.index({ waypoint: -1, maxTime: -1, dateTime: -1 });

export const IsochroneCacheModel = model<IsochroneCacheModel>('isochrones', cacheSchema);
export const LocationCacheModel = model<LocationCacheModel>('locations', locationSchema);
