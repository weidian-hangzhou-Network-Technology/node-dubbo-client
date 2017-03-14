const Registry = require('./registry');
const Config = require('./config');
const Log = require('./consumerLog');
const Invoker = require('./invoker');
const Protocol = require('../protocol');

//缓存当前所有的服务
const serviceMap = new Map();

const getInvoker = ({ serviceName, group, version }) => {
  let description = Invoker.getDescription({ serviceName, group, version });
  if (serviceMap.has(description)) {
    return Promise.resolve(serviceMap.get(description));
  } else {
    let invoker = new Invoker({ serviceName, group, version });
    serviceMap.set(invoker.toString(), invoker);
    return Registry.register(invoker);
  }
};

exports.init = (options) => {
  Config.setOptions(options);
  let registry = Config.getRegistry();
  return Registry.init(registry.url, registry.options);
};

exports.dispose = () => Registry.close().then(() => serviceMap.clear());

exports.setLog = (log) => Log.setLog(log, Config.getOptions().debug);

const checkMethod = (options) =>
  (methodName) => getInvoker(options)
    .then((invoker) => invoker.getAllProviders())
    .then((providers) => [...providers.values()].every((provider) => provider.hasMethod(methodName)));

const checkService = (options, protocol) =>
  () => getInvoker(options)
    .then((invoker) => invoker.getAllProviders())
    .then((providers) => [...providers.values()].some((provider) => provider.protocol === protocol && provider.canUse()));

exports.getService = ({ serviceName, group, version, protocol = 'jsonrpc' }) => ({
  check: (methodName) =>
    Promise.all([
      checkMethod({ serviceName, group, version })(methodName),
      checkService({ serviceName, group, version }, protocol)(),
    ]).then((args) => args.every((arg) => arg)),

  checkMethod: checkMethod({ serviceName, group, version }),

  checkService: checkService({ serviceName, group, version }, protocol),

  call: (methodName, data) =>
    getInvoker({ serviceName, group, version })
      .then((invoker) => invoker.getProvider(protocol))
      .then((provider) => {
        let description = Invoker.getDescription({ serviceName, group, version });
        if (!provider.hasMethod(methodName)) {
          return Promise.reject(new Error(`dubbo provider:${methodName} does not exist ${description}`));
        } else {
          if (!Protocol[protocol]) {
            return Promise.reject(new Error(`no protocol can suit.${description} ${methodName} ${protocol}`));
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
      }),
});
