/**
 * Hirly Live View - Main Frontend Logic
 */

let map;
const visitorMarkers = new Map();
let visitorsList = []; // Local cache of active visitors
let trafficChart;
const socket = io();
let currentFilter = 'key'; // Default to 'key' as requested

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupSocket();
    setupFilters();
    setupFullscreen();
    
    // Set initial filter state UI
    const allBtn = document.getElementById('filterAllEvents');
    const keyBtn = document.getElementById('filterKeyEvents');
    if (allBtn && keyBtn) {
        allBtn.classList.remove('active');
        keyBtn.classList.add('active');
    }
});

/**
 * Toggle Fullscreen for Map
 */
function setupFullscreen() {
    const btn = document.getElementById('fullscreenBtn');
    const container = document.querySelector('.live-map-container');
    
    if (!btn || !container) return;

    btn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            btn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            btn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    });

    // Listen for escape key or other ways fullscreen is exited
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            btn.innerHTML = '<i class="fas fa-expand"></i>';
            // Invalidate map size to prevent gray boxes
            setTimeout(() => map.invalidateSize(), 100);
        } else {
            setTimeout(() => map.invalidateSize(), 100);
        }
    });
}

/**
 * Setup Event Filters
 */
function setupFilters() {
    const allBtn = document.getElementById('filterAllEvents');
    const keyBtn = document.getElementById('filterKeyEvents');
    
    if (allBtn && keyBtn) {
        allBtn.addEventListener('click', () => {
            currentFilter = 'all';
            allBtn.classList.add('active');
            keyBtn.classList.remove('active');
        });
        
        keyBtn.addEventListener('click', () => {
            currentFilter = 'key';
            keyBtn.classList.add('active');
            allBtn.classList.remove('active');
        });
    }
}

/**
 * Initialize Leaflet Map with a Dark Theme
 */
function initMap() {
    // Center on Middle East with a wider view
    map = L.map('liveMap', {
        zoomControl: false,
        attributionControl: false
    }).setView([31.9522, 35.2332], 8);

    // Dark Mode Tiles (Using CartoDB Voyager Dark)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Update HUD coordinates on move
    map.on('move', () => {
        const center = map.getCenter();
        const latEl = document.getElementById('mapLat');
        const lonEl = document.getElementById('mapLon');
        if (latEl) latEl.innerText = center.lat.toFixed(4);
        if (lonEl) lonEl.innerText = center.lng.toFixed(4);
    });
}

/**
 * Setup Real-time Connection
 */
function setupSocket() {
    socket.emit('join-admin-live-view');

    socket.on('initial-state', (data) => {
        visitorsList = data.visitors;
        updateVisitorCount(data.visitorsCount);
        updateVisitStats(data.stats);
        
        // Clear and redraw map markers
        visitorMarkers.forEach(marker => map.removeLayer(marker));
        visitorMarkers.clear();
        data.visitors.forEach(v => addVisitorToMap(v));
        
        updateActivePages(data.visitors);
    });

    socket.on('new-visitor', (data) => {
        visitorsList.push(data);
        updateVisitorCount(data.totalActive);
        addVisitorToMap(data);
        addEventToFeed('visitor', `New visitor from <b>${data.location.city}, ${data.location.country}</b>`);
        updateActivePages(visitorsList);
    });

    socket.on('visitor-update', (data) => {
        // Only log view events if they are actually a page change
        const oldVisitor = visitorsList.find(v => v.id === data.id);
        if (oldVisitor && oldVisitor.page !== data.page) {
            addEventToFeed('view', `Visitor viewing <b>${data.page}</b>`);
        }
        
        addVisitorToMap(data);
        
        // Update local list
        const index = visitorsList.findIndex(v => v.id === data.id);
        if (index !== -1) {
            visitorsList[index] = data;
        } else {
            visitorsList.push(data);
        }
        
        // Update marker popup
        const marker = visitorMarkers.get(data.id);
        if (marker) {
            marker.setPopupContent(`<b>${data.location.city}</b><br>${data.page}`);
        }
        
        updateActivePages(visitorsList);
    });

    socket.on('visitor-left', (data) => {
        visitorsList = visitorsList.filter(v => v.id !== data.visitorId);
        updateVisitorCount(data.totalActive);
        removeVisitorFromMap(data.visitorId);
        updateActivePages(visitorsList);
    });

    socket.on('live-event', (data) => {
        addEventToFeed(data.type, data.message);
    });
}

/**
 * UI Update Helpers
 */
function updateVisitorCount(count) {
    const el = document.getElementById('activeVisitorsCount');
    if (el) {
        // Animate the number if it changed
        const current = parseInt(el.innerText) || 0;
        if (current !== count) {
            el.classList.add('pulse-number');
            setTimeout(() => el.classList.remove('pulse-number'), 500);
        }
        el.innerText = count;
    }
}

function updateVisitStats(stats) {
    if (!stats) return;
    
    const elements = {
        totalVisits: document.getElementById('totalVisits'),
        dailyVisits: document.getElementById('dailyVisits'),
        weeklyVisits: document.getElementById('weeklyVisits'),
        fiveMinVisits: document.getElementById('fiveMinVisits'),
        
        // New: Signup Counts
        totalSignups: document.getElementById('totalSignups'),
        dailySignups: document.getElementById('dailySignups'),
        weeklySignups: document.getElementById('weeklySignups'),

        // Rates
        conversionRate: document.getElementById('conversionRate'),
        totalRate: document.getElementById('totalConversionRate'),
        dailyRate: document.getElementById('dailyConversionRate'),
        weeklyRate: document.getElementById('weeklyConversionRate'),
        
        desktopPercent: document.getElementById('desktopPercent'),
        desktopBar: document.getElementById('desktopBar'),
        mobilePercent: document.getElementById('mobilePercent'),
        mobileBar: document.getElementById('mobileBar'),
        referrerStats: document.getElementById('referrerStats')
    };

    if (elements.totalVisits) elements.totalVisits.innerText = stats.total.toLocaleString();
    if (elements.dailyVisits) elements.dailyVisits.innerText = stats.daily.toLocaleString();
    if (elements.weeklyVisits) elements.weeklyVisits.innerText = stats.weekly.toLocaleString();
    if (elements.fiveMinVisits) elements.fiveMinVisits.innerText = stats.fiveMin.toLocaleString();
    
    // Counts
    if (stats.counts) {
        if (elements.totalSignups) elements.totalSignups.innerText = stats.counts.total.toLocaleString();
        if (elements.dailySignups) elements.dailySignups.innerText = stats.counts.daily.toLocaleString();
        if (elements.weeklySignups) elements.weeklySignups.innerText = stats.counts.weekly.toLocaleString();
    }

    // Rates
    if (stats.rates) {
        if (elements.conversionRate) elements.conversionRate.innerText = stats.rates.total + '%';
        if (elements.totalRate) elements.totalRate.innerText = stats.rates.total + '%';
        if (elements.dailyRate) elements.dailyRate.innerText = stats.rates.daily + '%';
        if (elements.weeklyRate) elements.weeklyRate.innerText = stats.rates.weekly + '%';
    }

    // Health Update
    if (stats.health) {
        const cpuEl = document.getElementById('serverCpu');
        const memEl = document.getElementById('serverMem');
        if (cpuEl) cpuEl.innerText = `CPU: ${stats.health.cpuLoad}`;
        if (memEl) memEl.innerText = `RAM: ${stats.health.memUsage}%`;
    }

    // Chart Update
    if (stats.history) {
        updateTrafficChart(stats.history);
    }

    // Device Stats
    if (stats.devices) {
        const totalDevices = (stats.devices.Desktop || 0) + (stats.devices.Mobile || 0);
        if (totalDevices > 0) {
            const dPerc = Math.round(((stats.devices.Desktop || 0) / totalDevices) * 100);
            const mPerc = 100 - dPerc;
            
            if (elements.desktopPercent) elements.desktopPercent.innerText = dPerc + '%';
            if (elements.desktopBar) elements.desktopBar.style.width = dPerc + '%';
            if (elements.mobilePercent) elements.mobilePercent.innerText = mPerc + '%';
            if (elements.mobileBar) elements.mobileBar.style.width = mPerc + '%';
        }
    }

    // Referrer Stats
    if (stats.referrers && elements.referrerStats) {
        elements.referrerStats.innerHTML = stats.referrers.map(ref => `
            <div class="referrer-item">
                <span class="ref-name" title="${ref.source}">${ref.source}</span>
                <span class="ref-count">${ref.count.toLocaleString()}</span>
            </div>
        `).join('');
    }
}

function updateTrafficChart(history) {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;

    const labels = history.map(h => h.label);
    const counts = history.map(h => h.count);

    if (!trafficChart) {
        trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visitors',
                    data: counts,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#111827',
                        titleColor: '#94a3b8',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: {
                            color: '#4b5563',
                            font: { size: 10 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        display: false,
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        trafficChart.data.labels = labels;
        trafficChart.data.datasets[0].data = counts;
        trafficChart.update('none'); // Update without animation for smoother feel
    }
}

/**
 * Human-readable page names
 */
const pageNameMap = {
    '/': 'Homepage',
    '/index.html': 'Homepage',
    '/jobs.html': 'Job Listings',
    '/services.html': 'Services Page',
    '/talent.html': 'Talent Discovery',
    '/about.html': 'About Us',
    '/contact.html': 'Contact Us',
    '/login.html': 'Login Page',
    '/signup.html': 'Signup Flow',
    '/employers.html': 'For Employers',
    '/profile.html': 'Talent Profile',
    '/employer_profile.html': 'Employer Profile',
    '/hire_dashboard.html': 'Hire Dashboard',
    '/user_dashboard.html': 'User Dashboard'
};

function getPageName(path) {
    // Handle paths with query strings
    const cleanPath = path.split('?')[0];
    return pageNameMap[cleanPath] || cleanPath;
}

function updateActivePages(visitors) {
    const el = document.getElementById('activePagesGrid');
    if (!el) return;

    const pageCounts = {};
    visitors.forEach(v => {
        const page = v.page || '/';
        pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);

    if (sortedPages.length === 0) {
        el.innerHTML = '<div class="text-xs text-gray-500 py-8">No active pages to show</div>';
        return;
    }

    el.innerHTML = sortedPages.map(([page, count]) => `
        <div class="page-card">
            <div class="page-info">
                <span class="page-name">${getPageName(page)}</span>
                <span class="page-url">${page}</span>
            </div>
            <div class="page-count">${count}</div>
        </div>
    `).join('');
}

function addVisitorToMap(visitor) {
    if (!visitor.location || !visitor.location.lat) return;

    // Remove existing marker if any
    if (visitorMarkers.has(visitor.id)) {
        map.removeLayer(visitorMarkers.get(visitor.id));
    }

    const marker = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="visitor-dot"><div class="visitor-dot-pulse"></div></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const sessionDuration = Math.round((Date.now() - (visitor.firstSeen || Date.now())) / 60000);
    const depth = visitor.pagesViewed || 1;
    const name = visitor.userName || `Visitor ${visitor.id.substr(0, 5)}`;

    const popupContent = `
        <div class="map-popup">
            <div class="popup-header">
                <span class="popup-city">${visitor.location.city}</span>
                <span class="popup-country">${visitor.location.country}</span>
            </div>
            <div class="popup-body">
                <div class="popup-row">
                    <i class="fas fa-user"></i>
                    <span><b>${name}</b></span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-clock"></i>
                    <span>On site for <b>${sessionDuration}m</b></span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-layer-group"></i>
                    <span>Viewed <b>${depth} pages</b></span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-location-dot"></i>
                    <span>Currently on <b>${getPageName(visitor.page)}</b></span>
                </div>
                <div class="popup-row">
                    <i class="fas fa-share-nodes"></i>
                    <span>Source: <b>${visitor.referrer ? getFriendlySourceName(visitor.referrer) : 'Direct'}</b></span>
                </div>
            </div>
        </div>
    `;

    const newMarker = L.marker([visitor.location.lat, visitor.location.lon], { icon: marker })
        .addTo(map)
        .bindPopup(popupContent, {
            className: 'custom-popup-theme',
            closeButton: false
        });

    visitorMarkers.set(visitor.id, newMarker);
}

/**
 * Client-side friendly name helper for referrers
 */
function getFriendlySourceName(ref) {
    if (!ref || ref === 'Direct') return 'Direct';
    const r = ref.toLowerCase();
    if (r.includes('instagram')) return 'Instagram';
    if (r.includes('facebook') || r.includes('fb.me')) return 'Facebook';
    if (r.includes('t.co') || r.includes('twitter') || r.includes('x.com')) return 'Twitter / X';
    if (r.includes('linkedin')) return 'LinkedIn';
    if (r.includes('whatsapp')) return 'WhatsApp';
    if (r.includes('google')) return 'Google';
    if (r.includes('gmail')) return 'Gmail';
    if (r.includes('hirly.net')) return 'Internal';
    
    try {
        return new URL(ref).hostname.replace('www.', '');
    } catch (e) {
        return ref;
    }
}

function removeVisitorFromMap(visitorId) {
    if (visitorMarkers.has(visitorId)) {
        map.removeLayer(visitorMarkers.get(visitorId));
        visitorMarkers.delete(visitorId);
    }
}

function addEventToFeed(type, message) {
    const feed = document.getElementById('liveEventList');
    if (!feed) return;

    // Filter logic
    const isKey = ['signup', 'job', 'application', 'rating'].includes(type);
    const filterClass = isKey ? 'event-key' : 'event-view';
    
    // Hide if "Key" filter is active but this is just a view
    const displayStyle = (currentFilter === 'key' && !isKey) ? 'none' : 'flex';

    // Remove empty state message if it's there
    if (feed.querySelector('.text-center')) {
        feed.innerHTML = '';
    }

    const icons = {
        visitor: 'fa-user-plus',
        view: 'fa-eye',
        signup: 'fa-user-check',
        job: 'fa-briefcase',
        application: 'fa-paper-plane',
        rating: 'fa-star'
    };

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const item = document.createElement('div');
    item.className = `feed-item ${filterClass}`;
    item.style.display = displayStyle;
    item.innerHTML = `
        <div class="feed-icon ${type}">
            <i class="fas ${icons[type] || 'fa-bolt'}"></i>
        </div>
        <div class="feed-content">
            <div class="message">${message}</div>
            <div class="feed-time">${time}</div>
        </div>
    `;

    feed.prepend(item);

    // Limit to 50 items to keep performance smooth and prevent page "breaking"
    const items = feed.getElementsByClassName('feed-item');
    if (items.length > 50) {
        feed.removeChild(items[items.length - 1]);
    }
}
