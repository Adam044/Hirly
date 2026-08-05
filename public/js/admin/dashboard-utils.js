/**
 * Dashboard Utility Functions
 * Shared helpers to avoid circular dependencies between API and UI modules.
 */

/**
 * Returns the CSS classes for a status badge based on the status string.
 * @param {string} status The status string (e.g., 'open', 'verified', 'pending')
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
            return 'bg-success/10 text-success border-success/20';
        case 'pending':
        case 'pending verification':
        case 'in_review':
        case 'student':
            return 'bg-warning/10 text-warning border-warning/20';
        case 'rejected':
        case 'closed':
        case 'inactive':
            return 'bg-danger/10 text-danger border-danger/20';
        default:
            return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-gray-400 text-sm font-medium animate-pulse">${text}</p>
        </div>
    `;
};
