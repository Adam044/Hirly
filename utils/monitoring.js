// Database and Performance Monitoring Utility
const logger = require('./logger');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            dbQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalEgress: 0,
            connectionPoolStats: {
                totalConnections: 0,
                idleConnections: 0,
                waitingClients: 0
            },
            fileServing: {
                totalRequests: 0,
                cachedResponses: 0,
                dbResponses: 0,
                totalBytesServed: 0
            }
        };
        this.startTime = Date.now();
        this.logInterval = null;
    }

    // Track database query
    trackDbQuery(querySize = 0) {
        this.metrics.dbQueries++;
        this.metrics.totalEgress += querySize;
    }

    // Track cache performance
    trackCacheHit(fileSize = 0) {
        this.metrics.cacheHits++;
        this.metrics.fileServing.cachedResponses++;
        this.metrics.fileServing.totalBytesServed += fileSize;
    }

    trackCacheMiss(fileSize = 0) {
        this.metrics.cacheMisses++;
        this.metrics.fileServing.dbResponses++;
        this.metrics.fileServing.totalBytesServed += fileSize;
    }

    // Track file serving
    trackFileRequest() {
        this.metrics.fileServing.totalRequests++;
    }

    // Update connection pool stats
    updateConnectionPoolStats(pool) {
        if (pool) {
            this.metrics.connectionPoolStats = {
                totalConnections: pool.totalCount || 0,
                idleConnections: pool.idleCount || 0,
                waitingClients: pool.waitingCount || 0
            };
        }
    }

    // Get cache hit rate
    getCacheHitRate() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        return total > 0 ? ((this.metrics.cacheHits / total) * 100).toFixed(2) : 0;
    }

    // Get performance summary
    getSummary() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        return {
            uptime: `${hours}h ${minutes}m ${seconds}s`,
            database: {
                totalQueries: this.metrics.dbQueries,
                estimatedEgress: `${(this.metrics.totalEgress / 1024 / 1024).toFixed(2)} MB`,
                queriesPerMinute: uptime > 0 ? (this.metrics.dbQueries / (uptime / 60)).toFixed(2) : 0
            },
            cache: {
                hitRate: `${this.getCacheHitRate()}%`,
                totalHits: this.metrics.cacheHits,
                totalMisses: this.metrics.cacheMisses
            },
            fileServing: {
                totalRequests: this.metrics.fileServing.totalRequests,
                cachedResponses: this.metrics.fileServing.cachedResponses,
                dbResponses: this.metrics.fileServing.dbResponses,
                totalBytesServed: `${(this.metrics.fileServing.totalBytesServed / 1024 / 1024).toFixed(2)} MB`,
                cacheEfficiency: this.metrics.fileServing.totalRequests > 0 ? 
                    `${((this.metrics.fileServing.cachedResponses / this.metrics.fileServing.totalRequests) * 100).toFixed(2)}%` : '0%'
            },
            connectionPool: this.metrics.connectionPoolStats
        };
    }

    // Start periodic logging
    startPeriodicLogging(intervalMinutes = 5) {
        this.logInterval = setInterval(() => {
            logger.info('Performance Metrics', this.getSummary());
        }, intervalMinutes * 60 * 1000);
    }

    // Stop periodic logging
    stopPeriodicLogging() {
        if (this.logInterval) {
            clearInterval(this.logInterval);
            this.logInterval = null;
        }
    }

    // Log current stats
    logCurrentStats() {
        logger.info('Current Performance Stats', this.getSummary());
    }
}

module.exports = PerformanceMonitor;