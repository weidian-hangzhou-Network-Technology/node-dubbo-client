const AJV = require('ajv');
const deepExtend = require('../../utils/deepExtend');

const ajv = new AJV({ removeAdditional: true });

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['description', 'registry', 'port'],
  properties: {
    description: {
      type: 'object',
      properties: {
        application: {
          type: 'string',
        },
        'application.version': {
          type: 'string',
        },
        category: {
          type: 'string',
        },
        dubbo: {
          type: 'string',
        },
        pid: {
          type: 'number',
        },
        version: {
          type: 'string',
        },
        server: {
          type: 'string',
        },
      },
    },
    registry: {
      type: 'object',
      additionalProperties: false,
      required: ['url'],
      properties: {
        url: {
          type: 'string',
        },
        options: {
          type: 'object',
          additionalProperties: false,
          properties: {
            sessionTimeout: {
              type: 'number',
            },
            spinDelay: {
              type: 'number',
            },
            retries: {
              type: 'number',
            },
          },
        },
      },
    },
    debug: {
      type: 'boolean',
    },
  },
};

const validate = ajv.compile(schema);

module.exports = (config) => {
  let configCopy = deepExtend({}, config);
  const valid = validate(configCopy);

  if (!valid) {
    throw new Error(`Config validation error: ${ajv.errorsText()}`);
  }

  return configCopy;
};
