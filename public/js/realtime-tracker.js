/**
 * Hirly Real-time Visitor Tracking Script
 * Lightweight script to notify the admin live view of active users.
 */
(function() {
    // 1. Identification: Use a persistent UUID to distinguish between devices
    let visitorId = localStorage.getItem('hirly_visitor_id');
    if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('hirly_visitor_id', visitorId);
    }

    // 2. Page Filter: Don't track admin pages or specific internal paths
    const path = window.location.pathname.toLowerCase();
    const excludedPatterns = ['/admin', '/realtime', '/api/', '/js/', '/css/', '/styling/', '/images/'];
    if (excludedPatterns.some(p => path.includes(p))) return;

    // 3. Socket Connection
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => {
        const socket = io();
        
        // Notify server of presence
        const getPayload = () => ({
            visitorId: visitorId,
            page: window.location.pathname.toLowerCase(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'Direct',
            // Try to identify if logged in (usually via a global user object or cookie)
            userId: window.currentUser ? window.currentUser.id : null,
            userName: window.currentUser ? (window.currentUser.first_name + ' ' + window.currentUser.last_name) : null
        });

        socket.emit('visitor-presence', getPayload());

        // Throttle scroll/activity events if we wanted to track engagement, 
        // but for now just handle page visibility to reduce noise
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                socket.emit('visitor-presence', getPayload());
            }
        });
    };
    document.head.appendChild(script);
})();
