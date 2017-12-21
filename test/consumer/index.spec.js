const sinon = require('sinon');
const proxyRequire = require('proxyquire');
const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;
const commonServiceInfo = { service: 'testService', group: 'testGroup', version: 'testVersion' };

describe('consumer', () => {
  const invokerStub = sinon.stub();
  const consumer = proxyRequire('../../lib/consumer', {
    './invoker': {
      getDescription: () => 'test',
      create: invokerStub,
    },
    '../config': { getDubboConfig: () => ({}) },
  });

  beforeEach(() => {
    invokerStub.reset();
  });

  it('same serviceInfo should create one invoker', () => {
    invokerStub.returns({ getProviders: sinon.stub().rejects() });
    return consumer
      .getService(commonServiceInfo)
      .call('testMehtod')
      .catch(() => consumer.getService(commonServiceInfo).call('testMehtod'))
      .catch(() => {
        expect(invokerStub).to.have.calledOnce;
      });
  });
});
