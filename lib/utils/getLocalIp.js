const OS = require('os');
const ifaces = OS.networkInterfaces();

module.exports = () => {
  let ip = null;

  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname].forEach((iface) => {
      //只取第一个有效的ip地址
      if (iface.family === 'IPv4' && !iface.internal && ip === null) {
        ip = iface.address;
      }
    });
  });

  return ip;
};
