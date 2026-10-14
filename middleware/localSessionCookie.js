// Permit local HTTP testing even when NODE_ENV is production. Both the host
// and the direct peer must be loopback; deployed HTTP keeps secure cookies.
module.exports = function localSessionCookie(req, res, next) {
  const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]'];
  const loopbackPeers = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (req.session && !req.secure &&
      !req.headers['x-forwarded-for'] && !req.headers.forwarded &&
      localHosts.includes(req.hostname) &&
      loopbackPeers.includes(req.socket.remoteAddress)) {
    req.session.cookie.secure = false;
  }
  next();
};
