// Request throttling middleware to prevent excessive concurrent requests
import { Request, Response, NextFunction } from 'express';
import { log as logger } from '@server/vite';

interface ThrottleConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

class RequestThrottler {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  throttle(config: ThrottleConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req);
      const now = Date.now();
      
      // Clean up expired entries
      this.cleanup(now);
      
      const requestData = this.requestCounts.get(key);
      
      if (!requestData || now > requestData.resetTime) {
        // Reset window for this key
        this.requestCounts.set(key, {
          count: 1,
          resetTime: now + config.windowMs
        });
        return next();
      }
      
      if (requestData.count >= config.maxRequests) {
        logger(`[RequestThrottler] Rate limit exceeded for ${req.method} ${req.originalUrl} from ${key}`, 'RequestThrottler');
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
        });
      }
      
      // Increment count
      requestData.count++;
      next();
    };
  }

  private generateKey(req: Request): string {
    // Use session ID if available (for authenticated users), otherwise IP
    return req.sessionID || req.ip || 'unknown';
  }

  private cleanup(now: number) {
    for (const [key, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}

export const requestThrottler = new RequestThrottler();

// Pre-configured throttle configs for different endpoint types
export const throttleConfigs = {
  // For frequently polled endpoints like chat conversations
  chatPolling: {
    windowMs: 10000, // 10 seconds
    maxRequests: 20,   // Max 20 requests per 10 seconds per user
  },
  
  // For authentication endpoints
  authentication: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,  // Max 10 auth attempts per minute
  },
  
  // For general API endpoints
  general: {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // Max 100 requests per minute per user
  }
};