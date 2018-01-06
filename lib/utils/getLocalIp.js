const OS = require('os');

const ifaces = OS.networkInterfaces();

/**
 * get local network ipv4 address
 * @return {string}
 */
module.exports = () => {
  let ip = null;

  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname].forEach((iface) => {
      // get the first valid ip.
      if (iface.family === 'IPv4' && !iface.internal && ip === null) {
        ip = iface.address;
      }
    });
  });

  return ip;
};
