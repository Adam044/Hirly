/**
 * Reviews Section Module
 */
import { getReviews, deleteReview } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, formatDate } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initReviews = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'reviews') {
            loadReviewsData();
        }
    });

    const clearBtn = document.getElementById('clearReviewFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            loadReviewsData();
        });
    }

    const tableBody = document.getElementById('reviewsTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-review-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                showConfirmationModal(
                    'Delete Review',
                    'Are you sure you want to remove this review? This action cannot be undone.',
                    async () => {
                        try {
                            await deleteReview(id);
                            showToast('Review deleted', 'success');
                            loadReviewsData();
                        } catch (err) {
                            showToast(err.message, 'error');
                        }
                    }
                );
            }
        });
    }
};

export const loadReviewsData = async () => {
    const tableBody = document.getElementById('reviewsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7">${createLoadingSpinner('Loading reviews...')}</td></tr>`;

    try {
        const data = await getReviews();
        if (data.success) {
            renderReviews(data.reviews || []);
        }
    } catch (error) {
        showToast('Failed to load reviews', 'error');
    }
};

const renderReviews = (reviews) => {
    const tableBody = document.getElementById('reviewsTableBody');
    if (!tableBody) return;

    if (reviews.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-gray-400 font-medium">No reviews found</td></tr>';
        return;
    }

    tableBody.innerHTML = reviews.map(r => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">#${r.id}</td>
            <td class="py-4 px-6 text-sm text-gray-900 font-bold">${r.job_title || 'N/A'}</td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-900">${r.reviewer_name}</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold">${r.reviewer_type}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-900">${r.reviewee_name}</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold">${r.reviewee_type}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-1 text-amber-400">
                    <i class="fas fa-star text-xs"></i>
                    <span class="text-sm font-black text-gray-900">${r.rating}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <p class="text-xs text-gray-600 line-clamp-2 max-w-xs">${r.comment || 'No comment'}</p>
            </td>
            <td class="py-4 px-6 text-right">
                <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center delete-review-btn" data-id="${r.id}">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </td>
        </tr>
    `).join('');
};
