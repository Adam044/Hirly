/**
 * Dashboard Section Renderer
 * Manages the display and initialization of different admin sections.
 */
import { state } from './state.js';

export class DashboardRenderer {
    constructor() {
        this.sections = {
            overview: document.getElementById('overviewSection'),
            leads: document.getElementById('leadsSection'),
            aggregator: document.getElementById('aggregatorSection'),
            aggregatedJobs: document.getElementById('aggregatedJobsSection'),
            jobs: document.getElementById('jobsSection'),
            companies: document.getElementById('companiesSection'),
            professionals: document.getElementById('professionalsSection'),
            alerts: document.getElementById('jobAlertsSection'),
            reviews: document.getElementById('reviewsSection'),
            notifications: document.getElementById('notificationsSection'),
            campaigns: document.getElementById('campaignsSection'),
            balancer: document.getElementById('balancerSection'),
            outreachIntel: document.getElementById('outreachIntelSection')
        };
        
        this.navLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
        this.headerTitle = document.getElementById('headerTitle');
        this.breadcrumbActive = document.getElementById('breadcrumbActive');
        
        this.init();
    }

    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.showSection(sectionId);
            });
        });

        // Initialize from URL hash or default to overview
        const handleHash = () => {
            const rawHash = window.location.hash.replace('#', '') || 'overview';
            // Convert hyphenated-hash to camelCaseHash
            const hash = rawHash.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            
            if (this.sections[hash]) {
                this.showSection(hash);
            }
        };

        window.addEventListener('hashchange', handleHash);
        handleHash();
    }

    render(sectionId) {
        this.showSection(sectionId);
    }

    showSection(sectionId) {
        // Hide all sections
        Object.values(this.sections).forEach(section => {
            if (section) {
                section.classList.remove('active');
                section.style.display = 'none';
            }
        });

        // Show target section
        const targetSection = this.sections[sectionId];
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            state.currentActiveSectionId = sectionId;
            
            // Update nav links active state
            this.navLinks.forEach(link => {
                const linkSection = link.getAttribute('data-section');
                if (linkSection === sectionId) {
                    link.classList.add('active-link');
                    // Update header title based on link text
                    const title = link.querySelector('span').textContent;
                    if (this.headerTitle) this.headerTitle.textContent = title;
                    if (this.breadcrumbActive) this.breadcrumbActive.textContent = title;
                } else {
                    link.classList.remove('active-link');
                }
            });

            // Trigger data load
            this.triggerSectionLoad(sectionId);
        }
    }

    triggerSectionLoad(sectionId) {
        // Dispatch custom event that section modules can listen to
        const event = new CustomEvent('sectionLoaded', { 
            detail: { sectionId } 
        });
        document.dispatchEvent(event);
        
        // Log for development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log(`[Renderer] Section loaded: ${sectionId}`);
        }
    }
}
