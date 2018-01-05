const serviceCallCounts = {};
// max round index
const threshold = 100000000;

module.exports = (providers, serviceDesc) => {
  let callCount = serviceCallCounts[serviceDesc] || 0;
  const index = callCount++ % providers.length;
  callCount %= threshold;
  serviceCallCounts[serviceDesc] = callCount;
  return providers[index];
};
