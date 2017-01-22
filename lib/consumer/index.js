const Registry = require('./registry');
const Config = require('./config');
const Log = require('../log');
const Invoker = require('./invoker');
const { PROTOCOL } = require('../constants');

//缓存当前所有的服务
const serviceMap = new Map();

function getInvoker(...args) {
  let description = Invoker.getDescription(...args);
  if (serviceMap.has(description)) {
    return Promise.resolve(serviceMap.get(description));
  } else {
    return Registry
      .register(new Invoker(...args))
      .then((invoker) => {
        if (!serviceMap.has(invoker.toString())) {
          serviceMap.set(invoker.toString(), invoker);
          return invoker;
        } else {
          return serviceMap.get(invoker.toString());
        }
      });
  }
}

exports.init = (options) => {
  Config.setOptions(options);
};

exports.setLog = (log) => {
  Log.setLog(log);
};

exports.getService = (name, group, version, protocol = PROTOCOL.JSONRPC) => ({
  call: function (methodName, ...args) {
    return getInvoker(name, group, version)
      .then((invoker) => invoker.getProvider(protocol))
      .then((provider) => {
        if (!provider.hasMethod(methodName)) {
          let description = Invoker.getDescription(name, group, version);
          return Promise.reject(new Error(`dubbo provider:${methodName} does not exist ${description}`));
        } else {
          //TODO
        }
      });
  },
});
