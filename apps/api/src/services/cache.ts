import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize Redis client using Upstash or Local URL
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function setCache(key: string, value: any, ttlSeconds: number = 86400) {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
        console.error('Redis sets error:', error);
    }
}

export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
}
