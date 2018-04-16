const AJV = require('ajv');
const deepExtend = require('deep-extend');

const ajv = new AJV({ removeAdditional: true });

/**
 * check config with given schema
 * @param {Object} config
 * @param {Object} schema
 * @return {Object}
 */
module.exports = (config, schema) => {
  const configCopy = deepExtend({}, config);
  const valid = ajv.validate(schema, configCopy);

  if (!valid) {
    throw new Error(`config check error: ${ajv.errorsText()}`);
  }

  return configCopy;
};
