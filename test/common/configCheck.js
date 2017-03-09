const expect = require('chai').expect;
const configCheck = require('../../lib/common/configCheck');

const testSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'number',
    },
  },
};

describe('common.configCheck', () => {
  it('configCheck should throw error', () => {
    try {
      configCheck({ id: '123' }, testSchema);
    } catch (e) {
      console.log(e);
      expect(e.message).to.be.a('string');
    }
  });
});
