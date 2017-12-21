const request = require('request');

const getId = () => `${Date.now()}${Math.floor(Math.random() * 100000)}`;

/**
 * create provider response data structure
 * @param {*} data
 * @param {Error} [error]
 * @return {string}
 */
exports.response = (data, error) => {
  let errorMsg = error;
  if (error instanceof Error) {
    errorMsg = error.message;
  }
  return JSON.stringify({
    jsonrpc: '2.0',
    id: getId(),
    result: data,
    error: errorMsg,
  });
};

/**
 * request provider
 * @param {Object} options
 * @property {number} options.timeout
 * @property {boolean} options.keepAlive
 * @param {string} host
 * @param {string} service
 * @param {string} method
 * @param {Array<*>} [data]
 * @return {Promise.<*>}
 */
exports.request = (options, host, service, method, data = []) =>
  new Promise((resolve, reject) => {
    const opts = {
      url: `http://${host}/${service}`,
      headers: {
        'Content-type': 'application/json-rpc',
        Accept: 'text/json',
      },
      body: {
        jsonrpc: '2.0',
        method,
        params: data,
        id: getId(),
      },
      timeout: options.timeout,
      forever: options.keepAlive,
    };

    request.post(opts, (err, response, resBody) => {
      if (err) {
        reject(new Error(`provider ${host} requested error. ${err.message}`));
      } else if (response.statusCode !== 200) {
        reject(new Error(`provider ${host} responsed with status ${response.statusCode}. ${resBody}`));
      } else {
        try {
          resBody = JSON.parse(resBody);
          if (resBody.error) {
            reject(new Error(`provider ${host} responsed with error: ${JSON.stringify(resBody.error)}`));
          } else {
            resolve(resBody.result);
          }
        } catch (e) {
          reject(new Error(`provider ${host} responsed with data that is not json string. ${resBody}`));
        }
      }
    });
  });
