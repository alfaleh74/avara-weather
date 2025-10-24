/**
 * Performance utilities and monitoring
 */

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Request deduplication cache
 */
class RequestCache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  /**
   * Get cached data or execute request
   * @param {string} key - Cache key
   * @param {Function} fetcher - Function to fetch data
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise} Cached or fresh data
   */
  async get(key, fetcher, ttl = 10000) {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if request is already pending
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Execute new request
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.pending.delete(key);
      return data;
    }).catch(error => {
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * Remove expired entries
   * @param {number} ttl - Time to live in milliseconds
   */
  cleanup(ttl = 10000) {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const requestCache = new RequestCache();

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
  }

  /**
   * Start timing
   * @param {string} name - Metric name
   */
  start(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
      this.marks.set(name, performance.now());
    }
  }

  /**
   * End timing and log
   * @param {string} name - Metric name
   */
  end(name) {
    if (typeof performance !== 'undefined') {
      const startTime = this.marks.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
        this.marks.delete(name);
        return duration;
      }
    }
    return 0;
  }

  /**
   * Measure component render time
   * @param {string} componentName - Component name
   * @param {Function} callback - Callback to measure
   */
  measureRender(componentName, callback) {
    this.start(`render-${componentName}`);
    const result = callback();
    this.end(`render-${componentName}`);
    return result;
  }
}

export const perfMonitor = new PerformanceMonitor();

