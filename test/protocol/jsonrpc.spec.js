const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));

const expect = chai.expect;

const request = require('request');

const jsonrpc = require('../../lib/protocol/jsonrpc');

describe('protocol.jsonrpc', () => {
  describe('response', () => {
    it('normal response', () => {
      const str = jsonrpc.response({ a: 1 });
      const parsed = JSON.parse(str);
      expect(parsed.jsonrpc).to.be.equal('2.0');
      expect(parsed.id).to.be.a('string');
      expect(parsed.result).to.be.deep.equal({ a: 1 });
      expect(parsed.error).to.be.undefined;
    });

    it('error response', () => {
      const str = jsonrpc.response({ a: 1 }, new Error('test'));
      const parsed = JSON.parse(str);
      expect(parsed.result).to.be.deep.equal({ a: 1 });
      expect(parsed.error).to.be.equal('test');
    });
  });

  describe('request', () => {
    const requestStub = sinon.stub(request, 'post');
    beforeEach(() => {
      requestStub.reset();
    });

    it('responsed with error should reject with error', () => {
      requestStub.callsArgWith(1, new Error('test error'));
      return expect(jsonrpc.request({}, 'test', 'testService', 'testMethod'))
        .to.be.rejectedWith(Error, 'test error');
    });

    it('responsed with http status code is not 200, should reject with error', () => {
      requestStub.callsArgWith(1, undefined, { statusCode: 500 }, 'test error');
      return expect(jsonrpc.request({}, 'test', 'testService', 'testMethod'))
        .to.be.rejectedWith(Error, 'provider test responsed with status 500. test error');
    });

    it('responsed with string can not convert into object should reject with error', () => {
      requestStub.callsArgWith(1, undefined, { statusCode: 200 }, 'this is a string');
      return expect(jsonrpc.request({}, 'test', 'testService', 'testMethod'))
        .to.be.rejectedWith(Error, 'provider test responsed with "this is a string"');
    });

    it('responsed data contain error property should reject with error', () => {
      requestStub.callsArgWith(1, undefined, { statusCode: 200 }, JSON.parse(jsonrpc.response({}, new Error('test error'))));
      return expect(jsonrpc.request({}, 'test', 'testService', 'testMethod'))
        .to.be.rejectedWith(Error, 'provider test responsed with error: "test error"');
    });

    it('responed right data should resolve with data object', () => {
      const data = {
        test: 1,
      };
      requestStub.callsArgWith(1, undefined, { statusCode: 200 }, JSON.parse(jsonrpc.response(data)));
      return expect(jsonrpc.request({}, 'test', 'testService', 'testMethod'))
        .to.eventually.be.deep.equal(data);
    });
  });
});
