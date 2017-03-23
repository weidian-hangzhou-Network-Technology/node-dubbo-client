const express = require('express');
const Logger = require('../providerLog');
const Handler = require('./handler');

const Listeners = new Map();
const Ports = new Set();
const Servers = [];

const createServer = (port) =>
  new Promise((resolve, reject) => {
    if (Ports.has(port)) {
      resolve();
    } else {
      try {
        const app = express();
        Handler(app, Listeners);
        const server = app.listen(port, () => {
          Logger.info(`Server start success on port ${port}`);
          Servers.push(server);
          resolve();
        });
      } catch (e) {
        reject(new Error(`Server start error.${e.message}`));
      }
    }
  });

exports.listen = ({ port, invoker }) => {
  Listeners.set(invoker.serviceName, invoker.methodsListeners);
  return createServer(port);
};

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    if (server.listening) {
      server.close((err) => {
        if (err) {
          reject(new Error(`Server close error.${err.message}`));
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });

exports.close = () => Promise.all(Servers.map((server) => closeServer(server)));
