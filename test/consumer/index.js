const expect = require('chai').expect;
const dubbo = require('../../lib/consumer');

dubbo.init({
  description: {
    application: 'weidian',
    'application.version': '1.0',
    category: 'consumers',
    dubbo: 'dubbo_node_client_1.0',
    side: 'consumer',
    pid: process.pid,
    version: '1.0.0',
  },
  registry: {
    url: '192.168.0.110:2181',
  },
  dubbo: {
    providerTimeout: 10,
  },
});

describe('service start', () => {
  it('method check pass', (calbak) => {
    dubbo
      .getService('com.weidian.shop.service.CouponService', 'shop', '1.0.0')
      .check('selectCouponDetailByHash')
      .then((result) => expect(result).to.be.true)
      .catch((error) => {
        console.error(error.message);
        expect(error).not.to.be.instanceof(Error);
      })
      .then(() => calbak());
  });

  it('method check not pass', (calbak) => {
    dubbo
      .getService('com.weidian.shop.service.CouponService', 'shop', '1.0.0')
      .check('test')
      .then((result) => expect(result).to.be.false)
      .catch((error) => {
        console.error(error.message);
        expect(error).not.to.be.instanceof(Error);
      })
      .then(() => calbak());
  });

  it('method call', (calbak) => {
    dubbo
      .getService('com.weidian.shop.service.CouponService', 'shop', '1.0.0')
      .call('selectCouponDetailByHash', ['ghd8fa01bdf649'])
      .then((result) => expect(result).to.be.an('object'))
      .catch((error) => {
        console.error(error.message);
        expect(error).not.to.be.instanceof(Error);
      })
      .then(() => calbak());
  });
});

describe('service close', () => {
  it('dispose register', (calbak) => {
    dubbo
      .dispose()
      .catch((error) => {
        console.error(error.message);
        expect(error).not.to.be.instanceof(Error);
      })
      .then(() => calbak());
  });
});
