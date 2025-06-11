// Request deduplication utility to prevent race conditions
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private cacheTimeout = 1000; // 1 second timeout for deduplication

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    // Create new request and store it
    const request = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, this.cacheTimeout);
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  clear(key?: string) {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();