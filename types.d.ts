interface configOptions {
    description: object;

    dubbo: {
        defaultWeight: number;
        timeout: number;
        keepAlive: boolean;
        protocol: string;
    }

    registry: {
        url: string;
        options: {
            sessionTimeout: number;
            spinDelay: number;
            retries: number;
        };
    }
}

export function config(options: configOptions): Promise<void>;

export function dispose(): Promise<void>;

export function setLogger(logger: (message: string) => void): void;

declare module consumer {
    interface serviceOperations {
        call: (methodName: string, data: Array<any>) => Promise<any>;
    }

    export function getService(serviceDescription: { service: string, group: string, version: string }): serviceOperations;
}

export const consumer = consumer;

class Provider {
    configServer(options: object): Provider;

    listen(port: number): Promise<void>;

    addMethods(functions: object): Provider;

    addMethod(functionName: string, handler: (params: [any]) => Promise<any>): Provider;
}

declare module provider {
    export function init(serviceDescription: { service: string, group: string, version: string }): Provider;
}

export const provider = provider;
