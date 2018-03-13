const debug = require('debug')('node-dubbo-client:consumer');
const Invoker = require('./invoker');
const config = require('../config');
const cluster = require('./cluster');
const protocol = require('../protocol');
const RETRY_CODE = require('../constants/retryCode');

const serviceMap = new Map();

const getInvoker = (serviceInfo) => {
  const desc = Invoker.getDescription(serviceInfo);
  if (serviceMap.has(desc)) {
    return serviceMap.get(desc);
  } else {
    const invoker = Invoker.create(serviceInfo);
    serviceMap.set(desc, invoker);
    return invoker;
  }
};

exports.getService = (serviceInfo) => {
  const desc = Invoker.getDescription(serviceInfo);
  return {
    call(methodName, data) {
      const dubboConfig = config.getDubboConfig();
      const invoker = getInvoker(serviceInfo);
      return invoker
        .getProviders(dubboConfig.protocol)
        .then((list) => {
          if (list.length === 0) {
            return Promise.reject(new Error(`no valid provider ${desc}`));
          } else {
            return cluster(desc, list);
          }
        })
        .then((provider) => protocol
          .getProtocol(dubboConfig.protocol)
          .request({
            timeout: dubboConfig.timeout,
            keepAlive: dubboConfig.keepAlive,
          }, provider.host, serviceInfo.service, methodName, data)
          .catch((err) => {
            if (RETRY_CODE.includes(err.code) && dubboConfig.enableRetry) {
              debug(`provider ${provider.host} ECONNREFUSED, retry with new provider`);
              invoker.disableProvider(provider.host);
              return this.call(methodName, data);
            } else {
              return Promise.reject(err);
            }
          }));
    },
  };
};
