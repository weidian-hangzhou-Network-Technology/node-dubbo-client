const random = require('./random');
const round = require('./round');
const config = require('../../config');

/**
 * get provider from list with load balance
 * @param {string} invokerDescription
 * @param {Array<Provider>} providers
 * @return {Provider}
 */
module.exports = (invokerDescription, providers) => {
  if (providers.length === 0) {
    throw new Error(`no provider for ${invokerDescription}`);
  } else if (providers.length === 1) {
    return providers[0];
  } else {
    return config.getLoadBalance() === 'random' ? random(providers) : round(providers, invokerDescription);
  }
};
