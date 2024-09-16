const { cache } = require('../cache');
const prisma = require('../prisma');

exports.update = async () => {
  console.log(`Server started: getting settings`);
  const dbPromises = [
    prisma.Settings.findMany(),
    prisma.Platforms.findMany(),
    prisma.Debates.findMany(),
  ];
  const database = await Promise.all(dbPromises);

  console.log(`Server started: settings got: ${JSON.stringify(database)}`);

  const cachePromises = [
    cache.set('settings', database[0].reduce((a, v) => ({ ...a, [v.name]: v.value }), {})),
    cache.set('platforms', database[1]),
    cache.set('debates', database[2]),
  ];
  await Promise.all(cachePromises);
  console.log(`Server started: settings cached`);
}