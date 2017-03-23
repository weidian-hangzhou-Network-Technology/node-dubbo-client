const serviceCallCounts = {};
const threshold = 100000000; // 最大调用次数,超过该阈值将进行重置.

module.exports = (providers, serviceDesc) => {
  let callCount = serviceCallCounts[serviceDesc] || 0;
  const index = ++callCount % providers.length;
  callCount %= threshold;
  serviceCallCounts[serviceDesc] = callCount;
  return providers[index];
};
