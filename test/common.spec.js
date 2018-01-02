const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));

const expect = chai.expect;

const InvokerBase = require('../lib/common/invokerBase');
const debug = require('debug');
const logHelper = require('../lib/common/logHelper');

describe('common', () => {
  describe('invokerBase', () => {
    it('getDescription should return with given content', () => {
      const serviceInfo = { service: 'service', group: 'group', version: 'version' };
      expect(InvokerBase.getDescription(serviceInfo)).to.be.equal('service_group_version');
    });

    it('setupPath should create path object', () => {
      const test = new InvokerBase();
      test.service = 'service';
      test.group = 'group';
      test.version = 'version';
      test.setupPath();
      expect(test.path).to.be.deep.equal({
        configurator: '/dubbo/service/configurators',
        provider: '/dubbo/service/providers',
        consumer: '/dubbo/service/consumers',
      });
    });

    it('toString should return serviceDescription', () => {
      const test = new InvokerBase();
      test.service = 'service';
      test.group = 'group';
      test.version = 'version';
      expect(test.toString()).to.be.equal('service_group_version');
    });
  });

  describe('logHelper', () => {
    it('default log shoule be debug', () => {
      debug.enable('test');
      debug.log = sinon.stub();
      logHelper.getLogger('test')('123');
      expect(debug.log).to.have.been.called;
    });

    it('set log function should be called', () => {
      const spy = sinon.spy();
      logHelper.setLogger(spy);
      logHelper.getLogger('test')('456');
      expect(spy).to.have.been.calledWith('[test] 456');
    });
  });
});
