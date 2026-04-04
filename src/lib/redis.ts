import { Redis } from "@upstash/redis";
import { config } from "../config.js";

export const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});
