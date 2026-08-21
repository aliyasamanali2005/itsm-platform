import IORedis from "ioredis";

// ==========================================
// REDIS CONNECTION
// ==========================================

const redis = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

// ==========================================
// REDIS EVENTS
// ==========================================

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});

export default redis;