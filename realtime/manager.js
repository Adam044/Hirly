const socketIo = require('socket.io');
const logger = require('../utils/logger');
const axios = require('axios');

const os = require('os');

let io;
let dbPool;
let statsCache = { data: null, lastUpdate: 0 };
const CACHE_TTL = 60000; // Increased to 60s for "Fast AF" efficiency

const activeVisitors = new Map(); // visitorId -> visitorData
const socketToVisitor = new Map(); // socket.id -> visitorId

/**
 * Gets real-time server health metrics
 */
const getServerHealth = () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1);
    
    // CPU load (1 min average)
    const load = os.loadavg()[0].toFixed(2);
    
    return {
        memUsage,
        cpuLoad: load,
        uptime: Math.floor(os.uptime() / 3600) // hours
    };
};

/**
 * Maps raw referrers to friendly names
 */
const getFriendlySource = (referrer) => {
    if (!referrer || referrer === 'Direct') return 'Direct';
    
    const r = referrer.toLowerCase();
    
    // Social
    if (r.includes('instagram.com')) return 'Instagram';
    if (r.includes('facebook.com') || r.includes('fb.me')) return 'Facebook';
    if (r.includes('t.co') || r.includes('twitter.com') || r.includes('x.com')) return 'Twitter / X';
    if (r.includes('linkedin.com')) return 'LinkedIn';
    if (r.includes('whatsapp.com')) return 'WhatsApp';
    if (r.includes('tiktok.com')) return 'TikTok';
    
    // Search
    if (r.includes('google.com')) return 'Google Search';
    if (r.includes('bing.com')) return 'Bing';
    if (r.includes('yahoo.com')) return 'Yahoo';
    
    // Email Apps
    if (r.includes('com.google.android.gm') || r.includes('mail.google.com')) return 'Gmail';
    if (r.includes('outlook.live.com') || r.includes('outlook.office.com')) return 'Outlook';
    
    // Mobile Apps (common patterns)
    if (r.startsWith('android-app://')) {
        const pkg = r.split('://')[1];
        if (pkg.includes('whatsapp')) return 'WhatsApp';
        if (pkg.includes('instagram')) return 'Instagram';
        if (pkg.includes('facebook')) return 'Facebook';
        if (pkg.includes('linkedin')) return 'LinkedIn';
        if (pkg.includes('messenger')) return 'Messenger';
        return 'Android App';
    }

    // Internal (don't show Hirly as a source if it's within the same domain)
    if (r.includes('hirly.net')) return 'Internal';

    // Extract domain as fallback
    try {
        const url = new URL(referrer);
        return url.hostname.replace('www.', '');
    } catch (e) {
        return 'Other';
    }
};

/**
 * Gets visit statistics from the database with per-period conversion rates
 */
const getVisitStats = async () => {
    if (!dbPool) return null;
    
    // Efficiency: Return cached stats if they are still fresh
    const now = Date.now();
    if (statsCache.data && (now - statsCache.lastUpdate < CACHE_TTL)) {
        return { ...statsCache.data, health: getServerHealth() };
    }

    try {
        const client = await dbPool.connect();
        try {
            // First get the timestamp of the first tracking entry
            const trackingStartRes = await client.query('SELECT MIN(created_at) as start FROM visitor_logs');
            const trackingStart = trackingStartRes.rows[0].start;

            const [
                totalVisits,
                dailyVisits,
                weeklyVisits,
                fiveMinVisits,
                totalUsers,
                dailyUsers,
                weeklyUsers,
                deviceDistribution,
                topReferrers,
                hourlyHistory,
                topLocations
            ] = await Promise.all([
                client.query('SELECT COUNT(DISTINCT visitor_id) FROM visitor_logs'),
                client.query("SELECT COUNT(DISTINCT visitor_id) FROM visitor_logs WHERE created_at > NOW() - INTERVAL '1 day'"),
                client.query("SELECT COUNT(DISTINCT visitor_id) FROM visitor_logs WHERE created_at > NOW() - INTERVAL '7 days'"),
                client.query("SELECT COUNT(DISTINCT visitor_id) FROM visitor_logs WHERE created_at > NOW() - INTERVAL '5 minutes'"),
                // Only count signups since we started tracking visits to keep the total conversion accurate
                client.query('SELECT COUNT(*) FROM users WHERE created_at >= $1', [trackingStart || now]),
                client.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '1 day'"),
                client.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
                // New: Distribution of devices in the last 7 days
                client.query("SELECT device_type, COUNT(*) FROM (SELECT DISTINCT ON (visitor_id) visitor_id, device_type FROM visitor_logs WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY visitor_id, created_at DESC) sub GROUP BY device_type"),
                // New: Top referrers in the last 7 days
                client.query("SELECT referrer, COUNT(*) FROM (SELECT DISTINCT ON (visitor_id) visitor_id, referrer FROM visitor_logs WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY visitor_id, created_at DESC) sub GROUP BY referrer ORDER BY count DESC LIMIT 5"),
                // New: Hourly traffic history for the last 24 hours
                client.query(`
                    SELECT 
                        TO_CHAR(hour, 'HH24:00') as label,
                        COUNT(DISTINCT visitor_id) as count
                    FROM 
                        generate_series(
                            date_trunc('hour', NOW()) - interval '23 hours',
                            date_trunc('hour', NOW()),
                            interval '1 hour'
                        ) AS hour
                    LEFT JOIN visitor_logs ON date_trunc('hour', created_at) = hour
                    GROUP BY hour
                    ORDER BY hour ASC
                `),
                // New: Top Locations (Cities)
                client.query(`
                    SELECT ip_address, COUNT(*) as count 
                    FROM visitor_logs 
                    WHERE created_at > NOW() - INTERVAL '7 days'
                    GROUP BY ip_address 
                    ORDER BY count DESC LIMIT 50
                `)
            ]);

            const totalV = parseInt(totalVisits.rows[0].count) || 0;
            const dailyV = parseInt(dailyVisits.rows[0].count) || 0;
            const weeklyV = parseInt(weeklyVisits.rows[0].count) || 0;

            const totalU = parseInt(totalUsers.rows[0].count) || 0;
            const dailyU = parseInt(dailyUsers.rows[0].count) || 0;
            const weeklyU = parseInt(weeklyUsers.rows[0].count) || 0;

            // Helper to calculate rate safely
            const calcRate = (u, v) => {
                if (v === 0) return "0";
                const rate = (u / v) * 100;
                return Math.min(rate, 100).toFixed(1);
            };

            const stats = {
                total: totalV,
                daily: dailyV,
                weekly: weeklyV,
                fiveMin: parseInt(fiveMinVisits.rows[0].count) || 0,
                counts: {
                    total: totalU,
                    daily: dailyU,
                    weekly: weeklyU
                },
                rates: {
                    total: calcRate(totalU, totalV),
                    daily: calcRate(dailyU, dailyV),
                    weekly: calcRate(weeklyU, weeklyV)
                },
                history: hourlyHistory.rows.map(row => ({
                    label: row.label,
                    count: parseInt(row.count) || 0
                })),
                devices: deviceDistribution.rows.reduce((acc, row) => {
                    acc[row.device_type || 'Unknown'] = parseInt(row.count);
                    return acc;
                }, {}),
                referrers: topReferrers.rows
                    .map(row => ({
                        source: getFriendlySource(row.referrer),
                        count: parseInt(row.count)
                    }))
                    .filter(ref => ref.source !== 'Internal') // Don't show internal navigation as a traffic source
                    .reduce((acc, current) => {
                        // Merge duplicates after friendly mapping (e.g. l.instagram.com and instagram.com both become Instagram)
                        const existing = acc.find(item => item.source === current.source);
                        if (existing) {
                            existing.count += current.count;
                        } else {
                            acc.push(current);
                        }
                        return acc;
                    }, [])
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5), // Keep top 5 after merging
                health: getServerHealth()
            };

            // Update cache
            statsCache = { data: stats, lastUpdate: now };
            return stats;
        } finally {
            client.release();
        }
    } catch (err) {
        logger.error(`Error fetching visit stats: ${err.message}`);
        return { ...statsCache.data, health: getServerHealth() }; 
    }
};

/**
 * Initializes Socket.io for real-time tracking
 */
const initRealtime = (server, pool) => {
    dbPool = pool;
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        // --- Admin Handlers ---
        socket.on('join-admin-live-view', async () => {
            socket.join('admin-live-view');
            const stats = await getVisitStats();
            socket.emit('initial-state', {
                visitorsCount: activeVisitors.size,
                visitors: Array.from(activeVisitors.values()),
                stats: stats
            });
        });

        // --- Visitor Handlers ---
        socket.on('visitor-presence', async (data) => {
            const visitorId = data.visitorId;
            const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
            
            socketToVisitor.set(socket.id, visitorId);

            // Parse device type from user agent
            const ua = (data.userAgent || '').toLowerCase();
            const deviceType = /mobile|android|iphone|ipad|phone/i.test(ua) ? 'Mobile' : 'Desktop';
            const cleanReferrer = (data.referrer || 'Direct').split('?')[0]; // Strip query params for cleaner stats

            // Log visit to DB
            if (dbPool) {
                dbPool.query(
                    'INSERT INTO visitor_logs (visitor_id, ip_address, user_agent, page_path, referrer, device_type) VALUES ($1, $2, $3, $4, $5, $6)',
                    [visitorId, ip, data.userAgent, data.page, cleanReferrer, deviceType]
                ).catch(err => logger.error(`Failed to log visitor: ${err.message}`));
            }

            // If new device or session
            if (!activeVisitors.has(visitorId)) {
                let location = { city: 'Unknown', country: 'Unknown', lat: 31.9522, lon: 35.2332 };
                
                const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
                
                if (ip && !isLocal) {
                    try {
                        const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,city,country,lat,lon`);
                        if (geoRes.data.status === 'success') {
                            location = {
                                city: geoRes.data.city,
                                country: geoRes.data.country,
                                lat: geoRes.data.lat,
                                lon: geoRes.data.lon
                            };
                        }
                    } catch (geoErr) {
                        logger.error(`GeoIP lookup failed: ${geoErr.message}`);
                    }
                } else if (isLocal) {
                    location.lat += (Math.random() - 0.5) * 0.1;
                    location.lon += (Math.random() - 0.5) * 0.1;
                    location.city = 'Local Testing';
                }

                const visitorData = {
                    id: visitorId,
                    userId: data.userId || null,
                    userName: data.userName || null,
                    ip: ip,
                    page: data.page,
                    location: location,
                    firstSeen: Date.now(), // Tracking session start
                    lastSeen: Date.now(),
                    pagesViewed: 1, // Tracking journey depth
                    userAgent: data.userAgent,
                    referrer: cleanReferrer,
                    sockets: new Set([socket.id])
                };

                activeVisitors.set(visitorId, visitorData);
                broadcastUpdate('new-visitor', { ...visitorData, sockets: undefined });
            } else {
                // Already exists, just add this socket to their set
                const visitor = activeVisitors.get(visitorId);
                visitor.sockets.add(socket.id);
                
                // Update identity if they just logged in
                if (data.userId) {
                    visitor.userId = data.userId;
                    visitor.userName = data.userName;
                }
                
                // If page changed, increment journey depth
                if (visitor.page !== data.page) {
                    visitor.pagesViewed++;
                }
                
                visitor.page = data.page;
                visitor.lastSeen = Date.now();
                broadcastUpdate('visitor-update', { ...visitor, sockets: undefined });
            }
        });

        socket.on('disconnect', () => {
            const visitorId = socketToVisitor.get(socket.id);
            if (visitorId && activeVisitors.has(visitorId)) {
                const visitor = activeVisitors.get(visitorId);
                visitor.sockets.delete(socket.id);
                
                // If NO more sockets (tabs) are open for this visitorId, they left
                if (visitor.sockets.size === 0) {
                    activeVisitors.delete(visitorId);
                    broadcastUpdate('visitor-left', { visitorId, totalActive: activeVisitors.size });
                }
                socketToVisitor.delete(socket.id);
            }
        });
    });

    // Periodic full state sync for admins (every 10s for more "live" feel)
    setInterval(async () => {
        if (io && activeVisitors.size >= 0) {
            const cleanVisitors = Array.from(activeVisitors.values()).map(v => {
                const { sockets, ...rest } = v;
                return rest;
            });
            const stats = await getVisitStats();
            io.to('admin-live-view').emit('initial-state', {
                visitorsCount: activeVisitors.size,
                visitors: cleanVisitors,
                stats: stats
            });
        }
    }, 10000);

    logger.info('Real-time Live View initialized');

    // --- Production Maintenance Tasks ---
    
    // Prune old visitor logs every 24 hours to keep the database lean
    // We keep 30 days of data for weekly/monthly trend analysis
    setInterval(async () => {
        if (!dbPool) return;
        try {
            const client = await dbPool.connect();
            try {
                const pruneRes = await client.query("DELETE FROM visitor_logs WHERE created_at < NOW() - INTERVAL '30 days'");
                if (pruneRes.rowCount > 0) {
                    logger.info(`Pruned ${pruneRes.rowCount} old visitor logs for efficiency.`);
                }
            } finally {
                client.release();
            }
        } catch (err) {
            logger.error(`Database pruning failed: ${err.message}`);
        }
    }, 24 * 60 * 60 * 1000); // Once a day

    return io;
};

/**
 * Middleware to track visitors - NO LONGER USED for counting, 
 * but kept for backward compatibility if needed for logs.
 */
const trackVisitor = async (req, res, next) => {
    next();
};

/**
 * Broadcasts events to the admin room
 */
const broadcastUpdate = (event, data) => {
    if (io) {
        io.to('admin-live-view').emit(event, {
            ...data,
            totalActive: activeVisitors.size
        });
    }
};

/**
 * Log specific events (e.g., signup, job post) to the live feed
 */
const logLiveEvent = (type, message, metadata = {}) => {
    if (io) {
        io.to('admin-live-view').emit('live-event', {
            type,
            message,
            metadata,
            timestamp: new Date()
        });
    }
};

module.exports = {
    initRealtime,
    trackVisitor,
    logLiveEvent
};
