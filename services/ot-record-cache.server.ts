import "server-only";

import { createHash } from "node:crypto";
import Redis from "ioredis";

const CACHE_TTL_SECONDS = 60;
let redisClient: Redis | null | undefined;

function getRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClient) {
    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 5_000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    redisClient = client;
    client.on("error", (error) => {
      console.error("OT record Redis connection error", error);
      if (redisClient === client) redisClient = null;
    });
  }

  return redisClient;
}

const hashKeyPart = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function versionKey(userId: string) {
  return `ot-records:${hashKeyPart(userId)}:version`;
}

function pageKey(userId: string, version: string, query: string) {
  return `ot-records:${hashKeyPart(userId)}:${version}:${hashKeyPart(query)}`;
}

function draftsKey(userId: string) {
  return `ot-record-drafts:${hashKeyPart(userId)}`;
}

function requireRedisClient() {
  const redis = getRedisClient();
  if (!redis) throw new Error("REDIS_URL is not configured");
  return redis;
}

export async function getOTRecordDrafts(userId: string) {
  return requireRedisClient().hgetall(draftsKey(userId));
}

export async function getOTRecordDraft(userId: string, draftId: string) {
  return requireRedisClient().hget(draftsKey(userId), draftId);
}

export async function saveOTRecordDraft(
  userId: string,
  draftId: string,
  draft: string,
) {
  await requireRedisClient().hset(draftsKey(userId), draftId, draft);
}

export async function deleteOTRecordDraft(userId: string, draftId: string) {
  await requireRedisClient().hdel(draftsKey(userId), draftId);
}

export async function getOTRecordCacheVersion(userId: string) {
  const redis = getRedisClient();
  if (!redis) return "0";
  return (await redis.get(versionKey(userId))) ?? "0";
}

export async function getCachedOTRecordPage<T>(
  userId: string,
  version: string,
  query: string,
): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  const result = await redis.get(pageKey(userId, version, query));
  return result === null ? null : JSON.parse(result) as T;
}

export async function setCachedOTRecordPage(
  userId: string,
  version: string,
  query: string,
  value: unknown,
) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.set(
    pageKey(userId, version, query),
    JSON.stringify(value),
    "EX",
    CACHE_TTL_SECONDS,
  );
}

export async function invalidateOTRecordCache(userId: string) {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.incr(versionKey(userId));
  } catch (error) {
    console.error("Unable to invalidate OT record Redis cache", error);
  }
}
