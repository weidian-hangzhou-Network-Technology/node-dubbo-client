const Request = require('request');

function post(url, data, timeout) {
  return new Promise((resolve, reject) => {
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
            reject(new Error(body.error));
          } else {
            resolve(body);
          }
        } catch (e) {
          reject(new Error(`Server response error.${body}`));
        }
      }
    });
  });
}

exports.input = (income) => {
  try {
    return JSON.parse(income);
  } catch (e) {
    throw new Error(`jsonrpc decode error.\t${e.message}\t${income}`);
  }
};

exports.output = ({ method, data, host, service, dubbo }) => {
  let postData = {
    jsonrpc: '2.0',
    method: method,
    params: data,
    id: `${Date.now()}${Math.floor(Math.random() * 100000)}`,
  };
  return post(`http://${host}/${service}`, postData, dubbo.providerTimeout);
};
