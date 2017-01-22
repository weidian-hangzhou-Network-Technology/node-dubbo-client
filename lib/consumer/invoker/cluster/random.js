module.exports = (providers) => {
  let providerCount = providers.length;
  let weights = providers.map((provider) => provider.weight);
  let allWeight = weights.reduce((calc, total) => calc + total);

  if (Math.max(...weights) === Math.min(...weights)) {
    let index = Math.ceil(Math.random() * providerCount) - 1;
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
