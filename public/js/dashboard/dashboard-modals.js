/**
 * dashboard-modals.js
 * Centralized modal management for the freelancer dashboard
 */

const DashboardModals = {
    /**
     * Shows a modal with animation
     * @param {HTMLElement|string} modal 
     */
    show(modal) {
        const el = typeof modal === 'string' ? document.getElementById(modal) : modal;
        if (!el) {
            console.error('Modal element not found:', modal);
            return;
        }
        
        console.log('Showing modal:', el.id);
        
        // Add 'show' class for CSS animations and visibility
        el.classList.add('show');
        // Also remove 'hidden' if it exists
        el.classList.remove('hidden');
        
        // Force flex display as a fallback
        el.style.display = 'flex'; 
        document.body.classList.add('overflow-hidden');
        
        // Add animation class if exists
        const content = el.querySelector('.modal-content, .modal-content-lg, .modal-container');
        if (content) {
            content.classList.add('animate-scale-in');
        }
    },

    /**
     * Hides a modal
     * @param {HTMLElement|string} modal 
     */
    hide(modal) {
        const el = typeof modal === 'string' ? document.getElementById(modal) : modal;
        if (!el) return;
        
        el.classList.remove('show');
        el.classList.add('hidden');
        el.style.display = 'none'; // Force hide
        document.body.classList.remove('overflow-hidden');
        
        // Remove animation class from content
        const content = el.querySelector('.modal-content, .modal-content-lg');
        if (content) {
            content.classList.remove('animate-scale-in');
        }
    },

    /**
     * Initializes modal close listeners
     */
    init() {
        // Close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hide(e.target);
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay.show, .modal-overlay:not(.hidden)');
                if (openModal) this.hide(openModal);
            }
        });

        // Close on any button with id starting with 'close' or 'cancel' or class 'modal-close' or data-modal attribute
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[id^="close"][id$="Btn"], [id^="cancel"][id$="Btn"], .modal-close, [data-modal]');
            if (btn) {
                // If it has data-modal, hide that specific modal
                const targetModalId = btn.getAttribute('data-modal');
                if (targetModalId) {
                    this.hide(targetModalId);
                } else {
                    // Otherwise hide the closest parent modal
                    const modal = btn.closest('.modal-overlay');
                    if (modal) {
                        this.hide(modal);
                    }
                }
            }
        });
        
        // Expose global show/hide
        window.showModal = (modal) => this.show(modal);
        window.hideModal = (modal) => this.hide(modal);
    }
};

window.DashboardModals = DashboardModals;
