// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

export function cache(durationSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.set('Cache-Control', `public, max-age=${durationSeconds}, s-maxage=${durationSeconds * 2}`);
    next();
  };
}
