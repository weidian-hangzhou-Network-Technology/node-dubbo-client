const expect = require('chai').expect;

const URL = require('url');
const utils = require('../utils');
const Provider = require('../../lib/consumer/provider');

describe('consumer.provider', () => {
  const providerUrl1 = URL.parse(utils.generateDubboDataPath('provider', {
    protocol: 'jsonrpc',
    host: '0.0.0.0:1234',
    service: 'testService',
    version: '1.0.0',
    group: 'testGroup',
    methods: ['m1', 'm2'],
  }));

  const configUrl1 = URL.parse(utils.generateDubboDataPath('config', {
    host: '0.0.0.0:1234',
    service: 'testService',
    disabled: true,
    enabled: false,
    weight: 100,
    group: 'testGroup',
    version: '1.0.0',
  }));

  const configUrl2 = URL.parse(utils.generateDubboDataPath('config', {
    host: '0.0.0.0:1234',
    service: 'testService',
    disabled: true,
    enabled: true,
    weight: 200,
    group: 'testGroup',
    version: '1.0.0',
  }));

  it('create provider with provider string', () => {
    const provider = new Provider(providerUrl1.host);
    provider.init(providerUrl1);
    const result = {
      configs: null,
      baseInfo: {
        dubbo: {
          'application.version': '1.0.0',
          'default.group': 'testGroup',
          interface: 'testService',
          methods: 'm1,m2',
        },
        protocol: 'jsonrpc',
        methods: ['m1', 'm2'],
      },
      host: '0.0.0.0:1234',
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  it('create provider with config string', () => {
    const provider = new Provider(configUrl1.host);
    provider.setup(configUrl1);
    const result = {
      configs: {
        enabled: false,
        disabled: true,
        weight: 100,
      },
      host: '0.0.0.0:1234',
      baseInfo: null,
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  it('config should be override by new config info', () => {
    const provider = new Provider(configUrl1.host);
    provider.setup(configUrl1);
    expect(provider.configs).to.be.deep.equal({
      enabled: false,
      disabled: true,
      weight: 100,
    });
    provider.setup(configUrl2);
    expect(provider.configs).to.be.deep.equal({
      enabled: true,
      disabled: true,
      weight: 200,
    });
  });

  context('getWeight', () => {
    it('if weight is not set, get default value', () => {
      const provider = new Provider(providerUrl1.host);
      provider.init(providerUrl1);
      expect(provider.getWeight()).to.be.equal(100);
    });

    it('if weight is configed, get configed value', () => {
      const provider = new Provider(configUrl2.host);
      provider.setup(configUrl2);
      expect(provider.getWeight()).to.be.equal(200);
    });
  });

  context('hasMethod', () => {
    it('provider should return true or false', () => {
      const provider = new Provider(providerUrl1.host);
      provider.init(providerUrl1);
      expect(provider.hasMethod('m1')).to.be.true;
      expect(provider.hasMethod('m3')).to.be.false;
    });
  });

  context('canUse', () => {
    it('config-provider should return false', () => {
      const provider = new Provider(configUrl1.host);
      provider.setup(configUrl1);
      expect(provider.canUse()).to.be.false;
    });

    it('provider should return true', () => {
      const provider = new Provider(providerUrl1.host);
      provider.setup(providerUrl1);
      expect(provider.canUse()).to.be.true;
    });
  });
});
