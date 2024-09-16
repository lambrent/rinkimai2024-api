const Redis = require('ioredis');
const options = {
  port: Number(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST, // Redis host
  password: process.env.REDIS_PASS,
  db: 0,
};
const redis = new Redis(options);

exports.redis = redis;
