const random = require('./random');
const round = require('./round');
const Config = require('../../config');

module.exports = (invokerDescription, providers) => {
  if (providers.length === 0) {
    throw new Error(`node-dubbo-client: no valid provider [${invokerDescription}]`);
  } else if (providers.length === 1) {
    return providers[0];
  } else {
    return Config.getLoadBalance() === 'random' ? random(providers) : round(providers, invokerDescription);
  }
};
