const sinon = require('sinon');
const proxyRequire = require('proxyquire');
const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;
const commonServiceInfo = (name) => ({ service: `testService${name}`, group: 'testGroup', version: 'testVersion' });

describe('consumer', () => {
  const invokerStub = sinon.stub();
  const clusterStub = sinon.stub();
  const requestStub = sinon.stub();
  const consumer = proxyRequire('../../lib/consumer', {
    './invoker': {
      getDescription: (sInfo) => Object.keys(sInfo).map((key) => sInfo[key]).join('_'),
      create: invokerStub,
    },
    './cluster': clusterStub,
    '../config': { getDubboConfig: () => ({ enableRetry: true }) },
    '../protocol': { getProtocol: () => ({ request: requestStub }) },
  });

  beforeEach(() => {
    invokerStub.reset();
    clusterStub.reset();
    requestStub.reset();
  });

  it('same serviceInfo should create one invoker', () => {
    invokerStub.returns({ getProviders: () => Promise.reject(new Error('test')) });
    const commonService = commonServiceInfo(1);
    return consumer
      .getService(commonService)
      .call('testMehtod')
      .catch(() => consumer.getService(commonService).call('testMehtod'))
      .catch(() => {
        expect(invokerStub).to.have.calledOnce;
      });
  });

  context('invoker call', () => {
    it('call once if request success', () => {
      invokerStub.returns({ getProviders: () => Promise.resolve([1]) });
      clusterStub.returns({ host: 'test' });
      requestStub.resolves();
      return consumer
        .getService(commonServiceInfo(2))
        .call('testMethod')
        .then(() => {
          expect(requestStub).to.have.been.calledOnce;
        });
    });
    it('call once if request throw normal error', () => {
      invokerStub.returns({ getProviders: () => Promise.resolve([1]) });
      clusterStub.returns({ host: 'test' });
      requestStub.rejects(new Error('test'));
      return consumer
        .getService(commonServiceInfo(3))
        .call('testMethod')
        .catch((err) => {
          expect(err.message).to.be.equal('test');
        });
    });
    it('call twice if request throw ECONNREFUSED error', () => {
      const stub = sinon.stub();
      invokerStub.returns({
        getProviders: () => Promise.resolve([1]),
        disableProvider: stub,
      });
      clusterStub.returns({ host: 'test' });
      const e = new Error('test');
      e.code = 'ECONNREFUSED';
      requestStub.onCall(0).rejects(e);
      requestStub.onCall(1).resolves();
      return consumer
        .getService(commonServiceInfo(4))
        .call('testMethod')
        .then(() => {
          expect(stub).to.have.been.calledOnce;
          expect(invokerStub).to.have.been.calledOnce;
          expect(clusterStub).to.have.been.calledTwice;
          expect(requestStub).to.have.been.calledTwice;
        });
    });
  });
});
