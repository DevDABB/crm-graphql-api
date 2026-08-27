import { redisClient } from "../config/redis.js";

const RATE_LIMIT = 60;
const WINDOW_SECONDS = 60;

const checkRateLimit = async (identifier) => {
  const key = `rate-limit:${identifier}`;

  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }

  if (count > RATE_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT - count,
  };
};

export {
  checkRateLimit,
};