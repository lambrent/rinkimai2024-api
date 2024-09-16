const { redis } = require('../redis');
const { cache } = require('../cache');
const { update } = require('./updateDatabases');

exports.get = async () => {
  let cacheSettings = await cache.get('settings');
  const redisSettings = await redis.hgetall('settings');

  if (cacheSettings?.version !== redisSettings?.version) await update();

  const promises = [
    cache.get('settings'),
    cache.get('platforms'),
    cache.get('debates'),
  ];

  const [settings, platforms, debates] = await Promise.all(promises);

  return {
    settings: redisSettings || settings,
    platforms,
    debates,
  }
}