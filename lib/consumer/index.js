const Registry = require('./registry');
const Config = require('./config');
const Log = require('../log');
const Invoker = require('./invoker');
const Protocol = require('../protocol');

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
  const registry = Config.getRegistry();
  Registry.init(registry.url, registry.options);
};

exports.setLog = (log) => {
  Log.setLog(log, Config.getOptions().debug);
};

exports.getService = (serviceName, group, version, protocol = 'jsonrpc') => ({
  call: function (methodName, ...args) {
    return getInvoker(serviceName, group, version)
      .then((invoker) => invoker.getProvider(protocol))
      .then((provider) => {
        if (!provider.hasMethod(methodName)) {
          let description = Invoker.getDescription(serviceName, group, version);
          return Promise.reject(new Error(`dubbo provider:${methodName} does not exist ${description}`));
        } else {
          if (!Protocol[protocol]) {
            throw new Error(`no protocol can suit.${serviceName} ${group} ${version} ${methodName} ${protocol}`);
          } else {
            return Protocol[protocol]({
              service: serviceName,
              host: provider.host,
              method: methodName,
              data: args,
              dubbo: Config.getDubboConfig(),
              description: Config.getDescription(),
            });
          }
        }
      });
  },
});
