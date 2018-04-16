module.exports = (providers) => {
  const providerCount = providers.length;
  const weights = providers.map((provider) => provider.getWeight());
  if (Math.max(...weights) === Math.min(...weights)) {
    const index = Math.ceil(Math.random() * providerCount) - 1;
    return providers[index];
  } else {
    const allWeight = weights.reduce((calc, total) => calc + total, 0);
    let offset = Math.ceil(Math.random() * allWeight);
    for (let index = 0; index < providerCount; index++) {
      offset -= providers[index].getWeight();
      if (offset <= 0) {
        return providers[index];
      }
    }
  }
};
