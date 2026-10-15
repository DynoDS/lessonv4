// Imitates the Codex sandbox: any connection to this computer's own address is refused.
const net = require("node:net");
const real = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const o = typeof args[0] === "object" && !Array.isArray(args[0]) ? args[0] : Array.isArray(args[0]) ? args[0][0] : { port: args[0], host: args[1] };
  if (o && o.port && !o.path) {
    const err = Object.assign(new Error(`connect EACCES 127.0.0.1:${o.port}`), { code: "EACCES", errno: -4092, syscall: "connect" });
    process.nextTick(() => this.destroy(err));
    return this;
  }
  return real.apply(this, args);
};
