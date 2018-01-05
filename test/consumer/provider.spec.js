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
    const provider = new Provider(providerUrl1);
    const result = {
      enabled: true,
      disabled: false,
      host: '0.0.0.0:1234',
      hostname: '0.0.0.0',
      port: '1234',
      protocol: 'jsonrpc',
      methods: ['m1', 'm2'],
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  it('create provider with config string', () => {
    const provider = new Provider(configUrl1);
    const result = {
      enabled: false,
      disabled: true,
      weight: 100,
      host: '0.0.0.0:1234',
      hostname: '0.0.0.0',
      port: '1234',
      protocol: 'override',
      methods: [],
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  it('override config-url to provider', () => {
    const provider = new Provider(providerUrl1);
    provider.config(configUrl1);
    const result = {
      enabled: false,
      disabled: true,
      weight: 100,
      host: '0.0.0.0:1234',
      hostname: '0.0.0.0',
      port: '1234',
      protocol: 'jsonrpc',
      methods: ['m1', 'm2'],
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  it('merge provider-url to config-provider', () => {
    const provider = new Provider(configUrl1);
    provider.config(providerUrl1);
    const result = {
      enabled: false,
      disabled: true,
      weight: 100,
      host: '0.0.0.0:1234',
      hostname: '0.0.0.0',
      port: '1234',
      protocol: 'jsonrpc',
      methods: ['m1', 'm2'],
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  it('override config-url to config-provider should use new config properties', () => {
    const provider = new Provider(configUrl1);
    provider.config(configUrl2);
    const result = {
      enabled: true,
      disabled: true,
      weight: 200,
      host: '0.0.0.0:1234',
      hostname: '0.0.0.0',
      port: '1234',
      protocol: 'override',
      methods: [],
    };
    Object.keys(result).forEach((key) => {
      expect(provider[key]).to.be.deep.equal(result[key]);
    });
  });

  context('hasMethod', () => {
    it('provider should return true or false', () => {
      const provider = new Provider(providerUrl1);
      expect(provider.hasMethod('m1')).to.be.true;
      expect(provider.hasMethod('m3')).to.be.false;
    });
  });

  context('resume', () => {
    it('config-provider properties should be changed', () => {
      const provider = new Provider(configUrl1);
      provider.resume();
      expect(provider.canUse()).to.be.true;
    });
  });

  context('canUse', () => {
    it('config-provider should return false', () => {
      const provider = new Provider(configUrl1);
      expect(provider.canUse()).to.be.false;
    });

    it('provider should return true', () => {
      const provider = new Provider(providerUrl1);
      expect(provider.canUse()).to.be.true;
    });
  });
});
