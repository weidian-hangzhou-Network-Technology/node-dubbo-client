const sinon = require('sinon');
const chai = require('chai');
const proxyRequire = require('proxyquire');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;
const http = require('http');

describe('provider.server', () => {
  const createServerStub = sinon.stub(http, 'createServer');
  const getRawBodyStub = sinon.stub();
  const Server = proxyRequire('../../lib/provider/server', { 'raw-body': getRawBodyStub });

  beforeEach(() => {
    createServerStub.reset();
    getRawBodyStub.reset();
  });

  it('create server should not throw error', () => {
    expect(() => {
      new Server();
    }).to.not.throw(Error);
  });

  describe('config server', () => {
    it('config server with property limit should be ok', () => {
      const server = new Server();
      server.config({ limit: '1000' });
      expect(server.opts.limit).to.be.equal('1000');
    });

    it('config server with unknown property should be ignored', () => {
      const server = new Server();
      server.config({ test: 1 });
      expect(server.opts).to.not.haveOwnProperty('test');
    });
  });

  describe('addHandler', () => {
    it('add handler that is not a function should throw error', () => {
      const server = new Server();
      expect(() => {
        server.addHandler('test', 'test');
      }).to.throw(TypeError);
    });

    it('add handler with function should be ok', () => {
      const server = new Server();
      expect(() => {
        server.addHandler('test', () => {
        });
      }).to.not.throw(Error);
    });
  });

  describe('listen', () => {
    it('should throw error when server listen failed', () => {
      const listenStub = sinon.stub();
      listenStub.callsArgWith(1, new Error('test error'));
      createServerStub.returns({ listen: listenStub });

      const server = new Server();
      expect(server.listen(10000)).to.be.rejectedWith(Error);
    });

    it('it should resolved if server listened success', () => {
      const listenStub = sinon.stub();
      listenStub.callsArg(1);
      createServerStub.returns({ listen: listenStub });

      const server = new Server();
      expect(server.listen(1000)).to.be.fulfilled;
    });
  });

  describe('server handle request', () => {
    const responseObj = {
      statusCode: undefined,
      setHeader: sinon.spy(),
      end: sinon.spy(),
    };
    beforeEach(() => {
      responseObj.statusCode = undefined;
      responseObj.setHeader.reset();
      responseObj.end.reset();
    });

    it('request with data that can not convert into json. should response with error', (done) => {
      new Server();

      getRawBodyStub.resolves('test');
      createServerStub.yield({}, responseObj);

      setTimeout(() => {
        expect(responseObj.statusCode).to.be.equal(500);
        expect(responseObj.end)
          .to.have.been.calledWith('body data parse fail. Unexpected token e in JSON at position 1', 'utf-8');
        done();
      }, 300);
    });

    it('request with function that has not been registered should response with error', (done) => {
      const server = new Server();
      server.addHandler('testName', () => {
      });

      getRawBodyStub.resolves('{"method":"test1","params":[]}');
      createServerStub.yield({}, responseObj);

      setTimeout(() => {
        expect(responseObj.statusCode).to.be.equal(500);
        expect(responseObj.end).to.have.been.calledWith('method:test1 not exist.', 'utf-8');
        done();
      }, 300);
    });

    describe('failed response', () => {
      it('added handler throw error should be responsed', (done) => {
        const server = new Server();
        const handlerStub = sinon.stub();
        handlerStub.callsFake(() => {
          throw new Error('throwed error');
        });
        server.addHandler('test', handlerStub);

        getRawBodyStub.resolves('{"method":"test","params":["123"]}');
        createServerStub.yield({}, responseObj);

        setTimeout(() => {
          expect(responseObj.statusCode).to.be.equal(200);
          const result = responseObj.end.args[0][0];
          expect(JSON.parse(result).error).to.be.equal('throwed error');
          done();
        }, 300);
      });

      it('added handler rejected error should be responsed', (done) => {
        const server = new Server();
        const handlerStub = sinon.stub();
        handlerStub.rejects(new Error('rejected error'));
        server.addHandler('test', handlerStub);

        getRawBodyStub.resolves('{"method":"test","params":["123"]}');
        createServerStub.yield({}, responseObj);

        setTimeout(() => {
          expect(responseObj.statusCode).to.be.equal(200);
          const result = responseObj.end.args[0][0];
          expect(JSON.parse(result).error).to.be.equal('rejected error');
          done();
        }, 300);
      });
    });

    describe('success response', () => {
      it('added handler resolve with data shoule be responsed', (done) => {
        const server = new Server();
        const handlerStub = sinon.stub();
        handlerStub.returns('resultdata');
        server.addHandler('test', handlerStub);

        getRawBodyStub.resolves('{"method":"test","params":["123"]}');
        createServerStub.yield({}, responseObj);

        setTimeout(() => {
          expect(handlerStub).to.have.been.calledWith('123');
          expect(responseObj.statusCode).to.be.equal(200);
          const result = responseObj.end.args[0][0];
          expect(JSON.parse(result).result).to.be.equal('resultdata');
          done();
        }, 300);
      });
    });
  });
});

