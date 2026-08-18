/**
 * dashboard-applications.js
 * Handles application listing, filtering, and status updates
 */

const DashboardApplications = {
    allApplications: [],
    currentFilter: 'all',

    /**
     * Initializes application filters and listeners
     */
    init() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Set filter and render
                this.currentFilter = btn.getAttribute('data-filter');
                this.render();
            });
        });

        // Setup "View All" button to navigate to the full applications section
        const viewAllBtn = document.getElementById('viewAllApplicationsBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                const navItem = document.querySelector('.nav-item[data-section="applications"]');
                if (navItem) {
                    navItem.click();
                }
            });
        }
    },

    /**
     * Renders applications based on current filter
     */
    render() {
        const containers = {
            overview: document.getElementById('recentApplicationsList'),
            main: document.getElementById('applicationsList')
        };
        
        const getDisplayStatus = (status) => {
            if (!status) return 'pending';
            const s = status.toLowerCase();
            return s === 'shortlisted' ? 'pending' : s;
        };

        // 1. Render Overview (Recent 3)
        if (containers.overview) {
            containers.overview.innerHTML = '';
            const recent = this.allApplications.slice(0, 3);
            
            if (recent.length === 0) {
                containers.overview.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-briefcase"></i></div>
                        <h3 class="empty-title" data-lang-key="no_applications">No applications yet</h3>
                        <p class="empty-description" data-lang-key="no_applications_desc">Start applying to jobs to see them here</p>
                    </div>
                `;
            } else {
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
                recent.forEach(app => grid.appendChild(this.createApplicationCard(app)));
                containers.overview.appendChild(grid);
            }
        }

        // 2. Render Main Applications Section
        if (containers.main) {
            containers.main.innerHTML = '';
            const filtered = this.currentFilter === 'all' 
                ? this.allApplications 
                : this.allApplications.filter(app => getDisplayStatus(app.status) === this.currentFilter);

            if (filtered.length === 0) {
                const filterLabel = window.translations?.[this.currentFilter]?.[window.currentLanguage] || this.currentFilter;
                containers.main.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-briefcase"></i></div>
                        <h3 class="empty-title">No ${filterLabel} applications</h3>
                    </div>
                `;
            } else {
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
                filtered.forEach(app => grid.appendChild(this.createApplicationCard(app)));
                containers.main.appendChild(grid);
            }
        }
    },

    /**
     * Creates an application card element
     * @param {Object} app 
     */
    createApplicationCard(app) {
        const card = document.createElement('div');
        card.className = 'application-card group bg-white rounded-[32px] border border-slate-100 p-1 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5';
        
        // Status normalization
        const status = (app.status || 'pending').toLowerCase();
        const displayStatus = status === 'shortlisted' ? 'pending' : status;

        const statusStyles = {
            'pending': {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-100/50',
                icon: 'fa-clock',
                label: window.translations?.['status_pending']?.[window.currentLanguage] || 'Pending'
            },
            'accepted': {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-100/50',
                icon: 'fa-check-circle',
                label: window.translations?.['status_accepted']?.[window.currentLanguage] || 'Accepted'
            },
            'rejected': {
                bg: 'bg-rose-50',
                text: 'text-rose-600',
                border: 'border-rose-100/50',
                icon: 'fa-times-circle',
                label: window.translations?.['status_rejected']?.[window.currentLanguage] || 'Rejected'
            }
        };

        const style = statusStyles[displayStatus] || statusStyles['pending'];

        card.innerHTML = `
            <div class="bg-slate-50/50 rounded-[28px] p-8 h-full flex flex-col">
                <div class="flex justify-between items-start mb-8">
                    <div class="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all duration-300 border border-slate-50">
                        <i class="fas fa-briefcase text-xl"></i>
                    </div>
                    <div class="flex items-center gap-2 px-4 py-2 rounded-xl border ${style.bg} ${style.text} ${style.border} font-bold text-[10px] tracking-widest uppercase">
                        <i class="fas ${style.icon} text-[10px]"></i>
                        <span>${style.label}</span>
                    </div>
                </div>

                <div class="flex-1 mb-8">
                    <h3 class="text-xl font-extrabold text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300 editorial-heading leading-tight">${app.job_title}</h3>
                    <div class="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest editorial-subheading">
                        <i class="fas fa-building text-[10px]"></i>
                        <span class="truncate">${app.company_name || (window.translations?.company_fallback?.[window.currentLanguage] || 'Company')}</span>
                    </div>
                </div>

                <div class="pt-8 border-t border-slate-100/50 flex items-center justify-between mt-auto">
                    <div class="flex flex-col">
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 editorial-subheading">${window.translations?.applied_on_text?.[window.currentLanguage] || 'Applied on'}</span>
                        <span class="text-sm font-extrabold text-slate-900">${new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <a href="#" onclick="const slug = window.generateJobSlug ? window.generateJobSlug('${app.job_title}', '${app.company_name}') : 'details'; this.href = '/jobs/${app.job_id}/' + slug; return true;" target="_blank" rel="noopener noreferrer" class="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-slate-900 hover:text-white shadow-sm transition-all duration-300 border border-slate-100" title="View Job">
                            <i class="fas fa-external-link-alt text-sm"></i>
                        </a>
                        <button class="view-details-btn w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-slate-900 hover:text-white shadow-sm transition-all duration-300 border border-slate-100" data-id="${app.id}" title="View Details">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        card.querySelector('.view-details-btn').addEventListener('click', () => {
            this.viewDetails(app.id);
        });

        return card;
    },

    /**
     * Updates application counts in the UI
     */
    updateCounts() {
        // Map shortlisted to pending for counts as well
        const counts = {
            all: this.allApplications.length,
            pending: this.allApplications.filter(a => a.status === 'pending' || a.status === 'shortlisted').length,
            accepted: this.allApplications.filter(a => a.status === 'accepted').length,
            rejected: this.allApplications.filter(a => a.status === 'rejected').length
        };

        // Update counts on filter buttons
        const filterPending = document.getElementById('filterPending');
        const filterAccepted = document.getElementById('filterAccepted');
        const filterRejected = document.getElementById('filterRejected');
        const filterAll = document.getElementById('filterAllApplications');

        // Optional: Update filter labels with counts if they have spans for it
        // For now just keep it clean

        // Update the main stats card via DashboardUI if possible
        if (window.DashboardUI) {
            window.DashboardUI.updateStats({
                applications: counts.all,
                services: window.userServicesCount || 0,
                profileViews: window.currentUser?.profile_views || 0
            });
        }
    },

    /**
     * Shows application details in a modal
     * @param {string} appId 
     */
    viewDetails(appId) {
        const app = this.allApplications.find(a => a.id === appId);
        if (!app) return;

        const modal = document.getElementById('applicationDetailsModal');
        if (!modal) return;

        // Populate modal fields
        document.getElementById('appDetailsJobTitle').textContent = app.job_title;
        
        // Handle Header Icon/Image
        const headerIcon = document.getElementById('appDetailsHeaderIcon');
        const headerImage = document.getElementById('appDetailsHeaderImage');
        if (app.job_image_path) {
            headerImage.src = app.job_image_path;
            headerImage.classList.remove('hidden');
            headerIcon.classList.add('hidden');
        } else {
            headerImage.classList.add('hidden');
            headerIcon.classList.remove('hidden');
        }

        const companyNameEl = document.getElementById('appDetailsCompanyName');
        const companyLinkEl = document.getElementById('appDetailsCompanyLink');
        
        companyNameEl.textContent = app.company_name || (window.translations?.company_fallback?.[window.currentLanguage] || 'Company');
        
        // Make company name clickable
        if (app.employer_id) {
            companyLinkEl.onclick = () => {
                window.location.href = `/hirly/profile.html?id=${app.employer_id}`;
            };
        } else {
            companyLinkEl.onclick = null;
        }

        document.getElementById('appDetailsDate').textContent = new Date(app.applied_at).toLocaleDateString();
        
        // Handle Freelance specific fields
        const freelanceSection = document.getElementById('freelanceOfferSection');
        if (app.job_type === 'Freelance') {
            freelanceSection.classList.remove('hidden');
            document.getElementById('appDetailsBidAmount').textContent = `${app.bid_amount} ${app.currency || 'USD'}`;
            document.getElementById('appDetailsTimeline').textContent = app.timeline || 'N/A';
        } else {
            freelanceSection.classList.add('hidden');
        }

        const statusEl = document.getElementById('appDetailsStatus');
        
        // Map shortlisted to pending for user display
        const status = (app.status || 'pending').toLowerCase();
        const displayStatus = status === 'shortlisted' ? 'pending' : status;
        
        const statusStyles = {
            'pending': {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-100',
                icon: 'fa-clock',
                label: window.translations?.['status_pending']?.[window.currentLanguage] || 'Pending'
            },
            'accepted': {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-100',
                icon: 'fa-check-circle',
                label: window.translations?.['status_accepted']?.[window.currentLanguage] || 'Accepted'
            },
            'rejected': {
                bg: 'bg-rose-50',
                text: 'text-rose-600',
                border: 'border-rose-100',
                icon: 'fa-times-circle',
                label: window.translations?.['status_rejected']?.[window.currentLanguage] || 'Rejected'
            }
        };

        const style = statusStyles[displayStatus] || statusStyles['pending'];
        
        statusEl.innerHTML = `
            <i class="fas ${style.icon} text-xs"></i>
            <span>${style.label.toUpperCase()}</span>
        `;
        statusEl.className = `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] border ${style.bg} ${style.text} ${style.border}`;
        
        const coverLetterEl = document.getElementById('appDetailsCoverLetter');
        if (app.proposal_message) {
            coverLetterEl.textContent = app.proposal_message;
            coverLetterEl.classList.remove('text-slate-400', 'italic');
            coverLetterEl.classList.add('text-slate-700');
        } else {
            coverLetterEl.textContent = window.translations?.no_cover_letter_msg?.[window.currentLanguage] || 'No message provided.';
            coverLetterEl.classList.add('text-slate-400', 'italic');
            coverLetterEl.classList.remove('text-slate-700');
        }

        // Setup View Job Post button
        const viewJobBtn = document.getElementById('viewJobPostBtn');
        if (viewJobBtn) {
            viewJobBtn.onclick = () => {
                window.open(`/job_details/${app.job_id}`, '_blank');
            };
        }

        // Setup Withdraw button
        const withdrawBtn = document.getElementById('withdrawApplicationBtn');
        if (withdrawBtn) {
            if (displayStatus === 'pending') {
                withdrawBtn.classList.remove('hidden');
                withdrawBtn.onclick = async () => {
                    if (confirm(window.translations?.withdraw_confirm?.[window.currentLanguage] || 'Are you sure you want to withdraw this application?')) {
                        try {
                            const response = await fetch(`/api/user/applications/${app.id}`, {
                                method: 'DELETE'
                            });
                            const result = await response.json();
                            if (result.success) {
                                // Close modal and refresh
                                if (window.DashboardModals) window.DashboardModals.hide(modal);
                                // Remove from local list and re-render
                                this.allApplications = this.allApplications.filter(a => a.id !== app.id);
                                this.render();
                                this.updateCounts();
                            } else {
                                alert(result.error || 'Failed to withdraw application');
                            }
                        } catch (error) {
                            console.error('Error withdrawing application:', error);
                            alert('An error occurred. Please try again.');
                        }
                    }
                };
            } else {
                withdrawBtn.classList.add('hidden');
            }
        }

        // Show modal
        if (window.DashboardModals) {
            window.DashboardModals.show(modal);
        }
    }
};

window.DashboardApplications = DashboardApplications;
