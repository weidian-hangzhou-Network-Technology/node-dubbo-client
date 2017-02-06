const expect = require('chai').expect;
const Check = require('../../lib/provider/config/check');
const deepExtend = require('../../lib/utils/deepExtend');

describe('config check', () => {
  it('with port', () => {
    const options = {
      description: {
        application: 'test',
        dubbo: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
      port: 9009,
    };

    expect(function () {
      const result = Check(options);
      expect(result).to.deep.equal(options);
    }).to.not.throw(Error);
  });

  it('without port', () => {
    const options = {
      description: {
        application: 'test',
        dubbo: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
    };

    expect(function () {
      const result = Check(options);
      expect(result).to.deep.equal(options);
    }).to.not.throw(Error);
  });
});
