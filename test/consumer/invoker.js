// jscs:disable maximumLineLength
const expect = require('chai').expect;

const Invoker = require('../../lib/consumer/invoker');
const Config = require('../../lib/consumer/config');

let invoker = null;

describe('invoker', () => {
  it('create invoker', () => {
    expect(function () {
      invoker = new Invoker({ serviceName: 'testService', group: 'test', version: '1.0.0' });
    }).to.not.throw(Error);
  });

  it('registryPath', () => {
    expect(invoker.getRegistryPath()).to.be.equal(`/dubbo/testService/consumers/consumer%3A%2F%2F${Config.ip}%2FtestService%3Fgroup%3Dtest%26dubbo%3Dtest%26application%3Dnode-dubbo-client%26application.version%3D1.0.0`);
  });

  it('providerPath', () => {
    expect(invoker.providerPath).to.be.equal('/dubbo/testService/providers');
  });

  it('configuratorsPath', () => {
    expect(invoker.configuratorsPath).to.be.equal('/dubbo/testService/configurators');
  });
});

