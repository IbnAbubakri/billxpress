export default function requestContext(req, res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  req.clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined)
    || req.ip || req.connection?.remoteAddress || '';
  req.clientUA = req.headers['user-agent'] || '';
  next();
}
