export const state = {
    currentActiveSectionId: 'overviewSection',
    currentFreelancerIdFilter: 'All',
    currentEmployerIdFilter: 'All',
    currentEmployerLogoFilter: 'all',
    currentEmployerTypeFilter: 'all',
    // Pagination
    pagination: {
        freelancers: { page: 1, limit: 10, hasMore: true, loading: false },
        employers: { page: 1, limit: 10, hasMore: true, loading: false },
        jobs: { page: 1, limit: 10, hasMore: true, loading: false },
        aggregatedJobs: { page: 1, limit: 10, hasMore: true, loading: false },
        outreach: { page: 1, limit: 10, hasMore: true, loading: false },
        outreachIntel: { page: 1, limit: 20, hasMore: true, loading: false }
    },
    
    // Advanced Filters
    filters: {
        freelancers: { search: '', status: 'All', category: 'all', profession: 'all', city: 'all' },
        employers: { search: '', status: 'All', type: 'all', logo: 'all', city: 'all' },
        jobs: { search: '', status: 'all', category: 'all', city: 'all' },
        aggregatedJobs: { search: '', logoStatus: 'all', sortBy: 'created_at', sortOrder: 'DESC' },
        outreach: { search: '', status: 'all', minApplicants: 5, emailStatus: 'all' },
        outreachIntel: { eventType: 'all' }
    },
    
    leadLanguages: new Map(), // Store selected language per job ID
    allCategories: [],
    allCities: [],
    allJobsData: [],
    allOutreachLeads: [],
    selectedJobs: new Map(),
    matchingRecipients: [],
    loggedInUserEmail: null,
    currentEmployerForLogo: null,
    
    // Selection Sets for Bulk Actions
    selectedFreelancers: new Set(),
    selectedEmployers: new Set(),
    selectedJobsList: new Set(),
    selectedJobAppNotificationIds: new Set(),
    
    // Campaign Progress
    activeCampaignId: null,
    campaignPollingInterval: null,
    
    // Jobs with Applications (Notifications)
    allJobsWithApplicationsData: [],
    selectedJobAppNotificationIds: new Set()
};
