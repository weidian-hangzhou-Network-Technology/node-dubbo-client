const expect = require('chai').expect;
const Invoker = require('../../lib/consumer/invoker');

let invoker = null;

describe('invoker', () => {
  it('create invoker', () => {
    expect(function () {
      invoker = new Invoker({ serviceName: 'testService', group: 'test', version: '1.0.0' });
    }).to.not.throw(Error);
  });

  it('providerPath', () => {
    expect(invoker.providerPath).to.be.equal('/dubbo/testService/providers');
  });

  it('configuratorsPath', () => {
    expect(invoker.configuratorsPath).to.be.equal('/dubbo/testService/configurators');
  });
});
