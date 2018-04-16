const expect = require('chai').expect;

const checkValue = require('../lib/utils/checkValue');
const configCheck = require('../lib/utils/configCheck');
const deepCopy = require('../lib/utils/deepCopy');
const deepFreeze = require('../lib/utils/deepFreeze');
const getLocalIp = require('../lib/utils/getLocalIp');

describe('utils', () => {
  describe('checkValue', () => {
    it('value exist should not throw error', () => {
      const obj = { a: 1 };
      expect(() => {
        checkValue(obj, 'a');
      }).to.not.throw(Error);
    });

    it('obj is undefined should throw error', () => {
      const obj = undefined;
      expect(() => {
        checkValue(obj, 'test');
      }).to.throw(Error);
    });

    it('value not exist should throw error', () => {
      const obj = { a: 1 };
      expect(() => {
        checkValue(obj, 'b');
      }).to.throw(Error);
    });
  });

  describe('configCheck', () => {
    const schema = {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'number'
        }
      },
    };

    it('check pass', () => {
      expect(() => {
        configCheck({ id: 1 }, schema);
      }).to.not.throw(Error);
    });

    it('check not pass', () => {
      expect(() => {
        configCheck({}, schema);
      }).to.throw(Error);
    });
  });

  describe('deepCopy', () => {
    it('nested object should not be equal', () => {
      const a = { b: { c: 1 } };
      const result = deepCopy(a);
      expect(a).to.not.equal(result);
      expect(a.b).to.not.equal(result.b);
    });
  });

  describe('deepFreeze', () => {
    it('nested properties should be freezed', () => {
      const a = { b: { test: 1 } };
      deepFreeze(a);
      expect(a).to.be.frozen;
      expect(a.b).to.be.frozen;
    });
  });

  describe('getLocalIp', () => {
    it('result should be a ip address', () => {
      const ip = getLocalIp();

      expect(/(\d{1,3}\.){3}\d{1,3}/.test(ip)).to.be.true;
    });
  });
});
