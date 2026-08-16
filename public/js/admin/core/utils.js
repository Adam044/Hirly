/**
 * Dashboard Utility Functions
 * Shared helpers for formatting, UI states, and common operations.
 */

/**
 * Returns the CSS classes for a status badge based on the status string.
 * @param {string} status The status string
 * @returns {string} Tailwind CSS classes
 */
export const getStatusBadgeClass = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'verified':
        case 'open':
        case 'active':
        case 'working now':
        case 'freelancer':
            return 'bg-green-50 text-green-600 border-green-100';
        case 'pending':
        case 'pending verification':
        case 'in_review':
        case 'student':
            return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'rejected':
        case 'closed':
        case 'inactive':
            return 'bg-red-50 text-red-600 border-red-100';
        default:
            return 'bg-gray-50 text-gray-500 border-gray-100';
    }
};

/**
 * Creates a standard loading spinner HTML.
 * @param {string} text Optional text to display below the spinner
 * @returns {string} HTML string
 */
export const createLoadingSpinner = (text = 'Loading...') => {
    return `
        <div class="flex flex-col items-center justify-center p-8">
            <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4 shadow-sm"></div>
            <p class="text-gray-500 text-sm font-semibold animate-pulse uppercase tracking-widest">${text}</p>
        </div>
    `;
};

/**
 * Formats a date string into a localized format.
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Debounce function for search inputs.
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
