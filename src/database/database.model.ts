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
    user: string;
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
    user: {
        type: String,
        index: true,
        required: true,
    },
    polygonResults: { type: [], required: true },
});

export const IsochroneCacheModel = model<IsochroneCacheModel>('isochrones', cacheSchema);
