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
        aggregatedJobs: { page: 1, limit: 10, hasMore: true, loading: false }
    },
    
    // Advanced Filters
    filters: {
        freelancers: { search: '', status: 'All', category: 'all', profession: 'all', city: 'all' },
        employers: { search: '', status: 'All', type: 'all', logo: 'all', city: 'all' },
        jobs: { search: '', status: 'all', category: 'all', city: 'all' },
        aggregatedJobs: { search: '', logoStatus: 'all' },
        outreach: { search: '', status: 'all', minApplicants: 1 }
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
    
    // Jobs with Applications (Notifications)
    allJobsWithApplicationsData: [],
    selectedJobAppNotificationIds: new Set()
};
