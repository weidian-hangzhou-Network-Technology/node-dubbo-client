const Invoker = require('./invoker');
const config = require('../config');
const cluster = require('./cluster');
const protocol = require('../protocol');

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
    call: (methodName, data) => {
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
          }, provider.host, serviceInfo.service, methodName, data));
    },
  };
};
