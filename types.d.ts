class configOptions {
    description: object;
    debug?: boolean;
    loadBalance?: string;

    dubbo?: {
        defaultWeight: number;
        timeout: number;
        keepAlive: boolean;
        protocol: string;
    };

    registry: {
        url: string;
        options?: {
            sessionTimeout: number;
            spinDelay: number;
            retries: number;
        };
    };
}

interface serviceOperations {
    call: (methodName: string, data: Array<any>) => Promise<any>;
}

class Provider {
    configServer(options: object): Provider;

    listen(port: number): Promise<void>;

    addMethods(functions: object): Provider;

    addMethod(functionName: string, handler: (params: [any]) => Promise<any>): Provider;
}

declare module 'node-dubbo-client' {
    export function config(options: configOptions): Promise<void>;

    export function dispose(): Promise<void>;

    export function onLog(calbak: (message: string) => void): void;

    export const provider = {
        init: function (serviceDescription: { service: string, group: string, version: string }): Provider
    };

    export const consumer = {
        getService: function (serviceDescription: { service: string, group: string, version: string }): serviceOperations
    };
}
