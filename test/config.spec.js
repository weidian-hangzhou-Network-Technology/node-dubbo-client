const expect = require('chai').expect;

const config = require('../lib/config');

describe('config', () => {
  it('ip should be setup on init', () => {
    expect(config.ip).to.be.a('string');
  });

  it('call functions before setOprions should throw error', () => {
    expect(() => {
      config.getDescription();
    }).to.throw(Error);
  });

  it('registry is empty should throw error', () => {
    expect(() => {
      config.setOptions({});
    }).to.throw(Error);
  });

  describe('default config', () => {
    beforeEach(() => {
      config.setOptions({
        registry: {
          url: 'test',
        },
      });
    });

    it('getRegistry', () => {
      expect(config.getRegistry()).to.be.deep.equal({
        url: 'test',
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      });
    });

    it('getDubboConfig', () => {
      expect(config.getDubboConfig()).to.be.deep.equal({
        timeout: 45 * 1000,
        keepAlive: true,
        protocol: 'jsonrpc',
      });
    });

    it('getDescription', () => {
      expect(config.getDescription()).to.be.deep.equal({});
    });

    it('getLoadBalance', () => {
      expect(config.getLoadBalance()).to.be.equal('round');
    });

    it('debug', () => {
      expect(config.debug()).to.be.equal(false);
    });
  });
});
