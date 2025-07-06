import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} else {
    console.warn("Upstash Redis credentials are not set. Rate limiting will be disabled.");
}

// A generic ratelimiter for authenticated users, allowing 10 requests per 10 seconds.
export const getRateLimiter = () => {
    if (redis) {
        return new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(10, "10 s"),
            analytics: true,
            prefix: "ratelimit_user",
        });
    }

    // Return a mock limiter if Redis is not configured, which always allows requests.
    // This is useful for local development without needing a Redis instance.
    return {
        limit: async (_identifier: string) => ({
            success: true,
            limit: 10,
            remaining: 10,
            reset: Date.now() + 10000,
        }),
    };
};
