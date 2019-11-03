import { SSM } from 'aws-sdk';

let config = {
    DATABASE_URL: 'init',
    BING_MAPS_KEY: 'init',
};

export async function loadPsConfig(PS_PATH?: string) {
    console.debug('loading params');
    if (typeof PS_PATH === 'undefined') {
        throw new Error('PS_PATH not defined');
    }

    const manager = new SSM();
    const paramReq: SSM.GetParameterRequest = {
        Name: PS_PATH,
        WithDecryption: true,
    };

    const data = await getParameterAsyncWrapper(manager, paramReq);

    if (typeof data.Parameter === 'undefined') {
        throw new Error('params not found');
    }

    if (typeof data.Parameter.Value === 'undefined') {
        throw new Error('found param but value was undefined');
    }

    const newConfig = JSON.parse(data.Parameter.Value);

    const oldKeys = Object.keys(config);
    const newKeys = Object.keys(newConfig);
    const intersection = oldKeys.filter(key => !newKeys.includes(key));
    if (intersection.length !== 0) {
        throw new Error(`not all config items specified! ${intersection}`);
    }

    config = newConfig;
    console.debug('params loaded');
}

export function getPsConfig() {
    if (config.BING_MAPS_KEY === 'init') {
        throw new Error('tried to get config before it was initialised');
    }

    return config;
}

export function checkPsConfig() {
    return !(config.BING_MAPS_KEY === 'init');
}

function getParameterAsyncWrapper(manager: SSM, param: SSM.GetParameterRequest) {
    return new Promise<SSM.Types.GetParameterResult>((resolve, reject) => {
        manager.getParameter(param, (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}
