const Registry = require('./registry');
const Config = require('./config');
const Log = require('./consumerLog');
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

exports.dispose = () => Registry.close();

exports.setLog = (log) => Log.setLog(log, Config.getOptions().debug);

exports.getService = (serviceName, group, version, protocol = 'jsonrpc') => ({
  check: function (methodName) {
    return getInvoker(serviceName, group, version)
      .then((invoker) => invoker.getAllProviders())
      .then((providers) => [...providers.values()].every((provider) => provider.hasMethod(methodName)));
  },

  call: function (methodName, data) {
    return getInvoker(serviceName, group, version)
      .then((invoker) => invoker.getProvider(protocol))
      .then((provider) => {
        let description = Invoker.getDescription(serviceName, group, version);
        if (!provider.hasMethod(methodName)) {
          return Promise.reject(new Error(`dubbo provider:${methodName} does not exist ${description}`));
        } else {
          if (!Protocol[protocol]) {
            throw new Error(`no protocol can suit.${description} ${methodName} ${protocol}`);
          } else {
            return Protocol[protocol].output({
              service: serviceName,
              host: provider.host,
              method: methodName,
              data: data,
              dubbo: Config.getDubboConfig(),
              description: Config.getDescription(),
            });
          }
        }
      });
  },
});
