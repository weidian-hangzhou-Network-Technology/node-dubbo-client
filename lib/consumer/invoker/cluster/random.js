module.exports = (providers) => {
  const providerCount = providers.length;
  const weights = providers.map((provider) => provider.weight);
  const allWeight = weights.reduce((calc, total) => calc + total, 0);

  if (Math.max(...weights) === Math.min(...weights)) {
    const index = Math.ceil(Math.random() * providerCount) - 1;
    return providers[index];
  } else {
    let offset = Math.ceil(Math.random() * allWeight);
    for (let index = 0; index < providerCount; index++) {
      offset -= providers[index].weight;
      if (offset <= 0) {
        return providers[index];
      }
    }
  }
};
