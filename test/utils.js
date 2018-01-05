exports.generateDubboDataPath = (type, data) => {
  const { protocol, host, service, group, version, methods, disabled, enabled, weight } = data;

  if (type === 'config') {
    return `override://${host}/${service}?`
      + `category=configurators&disabled=${disabled}&dynamic=false`
      + `&enabled=${enabled}&weight=${weight}&group=${group}&version=${version}`;
  }

  if (type === 'provider') {
    return `${protocol}://${host}/${service}`
      + `?application.version=${version}&default.group=${group}&interface=${service}&methods=${methods.join(',')}`;
  }

  if (type === 'consumer') {
    return `consumer://${host}/${group}/${service}:${version}`;
  }

  return '';
};
