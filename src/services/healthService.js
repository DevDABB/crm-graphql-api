import mongoose from "mongoose";
import { redisClient } from "../config/redis.js";

const getHealth = () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
};

const getReadiness = async () => {
  const checks = {
    mongodb: false,
    redis: false,
  };

  checks.mongodb = mongoose.connection.readyState === 1;

  try {
    await redisClient.ping();
    checks.redis = true;
  } catch (error) {
    checks.redis = false;
  }

  const ready = checks.mongodb && checks.redis;

  return {
    status: ready ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    checks,
  };
};

export {
  getHealth,
  getReadiness,
};