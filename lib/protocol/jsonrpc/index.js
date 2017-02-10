const Request = require('request');

const getId = () => `${Date.now()}${Math.floor(Math.random() * 100000)}`;

const post = (url, data, timeout) =>
  new Promise((resolve, reject) => {
    Request({
      url: url,
      method: 'post',
      headers: {
        'Content-type': 'application/json-rpc',
        Accept: 'text/json',
      },
      body: JSON.stringify(data),
      timeout: timeout,
    }, function (err, response, body) {
      if (err) {
        reject(err);
      } else {
        try {
          body = JSON.parse(body);
          if (body.error) {
            reject(new Error(`provider ${url} responsed with error ${JSON.stringify(body.error)}`));
          } else {
            resolve(body.result);
          }
        } catch (e) {
          reject(new Error(`Server response error.${body}`));
        }
      }
    });
  });

exports.input = (data) =>
  JSON.stringify({
    jsonrpc: '2.0',
    id: getId(),
    result: data,
  });

exports.output = ({ method, data, host, service, dubbo }) =>
  post(
    `http://${host}/${service}`,
    {
      jsonrpc: '2.0',
      method: method,
      params: data,
      id: getId(),
    },
    dubbo.providerTimeout
  );
