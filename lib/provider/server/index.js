const express = require('express');
const Logger = require('../providerLog');
const Handler = require('./handler');

const Listeners = new Map();
const Ports = new Set();

let Server = null;

const createServer = (port) =>
  new Promise((resolve, reject) => {
    if (Ports.has(port)) {
      resolve();
    } else {
      const app = express();
      try {
        Server = app.listen(port, () => {
          Logger.info(`Server start success on port ${port}`);
          resolve();
        });
        Handler(app, Listeners);
      } catch (e) {
        reject(new Error(`Server start error.${e.message}`));
      }
    }
  });

exports.listen = ({ port, invoker }) => {
  Listeners.set(invoker.serviceName, invoker.methodsListeners);
  return createServer(port);
};

exports.close = () =>
  new Promise((resolve, reject) => {
    Server.close((err) => {
      if (err) {
        reject(new Error(`Server close error.${err.message}`));
      } else {
        resolve();
      }
    });
  });
