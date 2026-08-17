/**
 * dashboard-api.js
 * Handles all API calls for the freelancer dashboard
 */

const DashboardAPI = {
    /**
     * Fetches current freelancer profile data
     */
    async getProfile() {
        try {
            const response = await fetch(`/api/user/profile?t=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to fetch profile');
            return await response.json();
        } catch (error) {
            console.error('API Error (getProfile):', error);
            throw error;
        }
    },

    /**
     * Updates freelancer profile data
     * @param {FormData} formData 
     */
    async updateProfile(formData) {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to update profile');
            return await response.json();
        } catch (error) {
            console.error('API Error (updateProfile):', error);
            throw error;
        }
    },

    /**
     * Fetches email preferences
     */
    async getEmailPreferences() {
        try {
            const response = await fetch('/api/email-preferences');
            if (!response.ok) throw new Error('Failed to fetch email preferences');
            return await response.json();
        } catch (error) {
            console.error('API Error (getEmailPreferences):', error);
            throw error;
        }
    },

    /**
     * Updates email preferences
     * @param {Object} preferences 
     */
    async updateEmailPreferences(preferences) {
        try {
            const response = await fetch('/api/email-preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });
            if (!response.ok) throw new Error('Failed to update email preferences');
            return await response.json();
        } catch (error) {
            console.error('API Error (updateEmailPreferences):', error);
            throw error;
        }
    },

    /**
     * Fetches all applications for the freelancer
     */
    async getApplications() {
        try {
            const response = await fetch('/api/user/applications');
            if (!response.ok) throw new Error('Failed to fetch applications');
            const data = await response.json();
            
            // Normalize application data for UI
            const applications = (data.applications || []).map(app => {
                let companyName = app.company_name;
                
                if (!companyName) {
                    if (app.is_external && app.external_company_name) {
                        companyName = app.external_company_name;
                    } else if (app.first_name || app.last_name) {
                        companyName = `${app.first_name || ''} ${app.last_name || ''}`.trim();
                    } else if (app.is_external && app.external_source) {
                        companyName = app.external_source;
                    }
                }

                return {
                    ...app,
                    company_name: companyName || (window.translations?.company_fallback?.[window.currentLanguage] || 'Company'),
                    created_at: app.applied_at // Map applied_at to created_at for UI
                };
            });

            return { success: true, data: applications };
        } catch (error) {
            console.error('API Error (getApplications):', error);
            throw error;
        }
    },

    /**
     * Fetches all services for the freelancer
     */
    async getServices() {
        try {
            const response = await fetch('/api/user/services');
            if (!response.ok) throw new Error('Failed to fetch services');
            const data = await response.json();
            
            // Normalize service data for UI
            const services = (data.services || []).map(service => ({
                id: service.id,
                title: service.service_title,
                description: service.service_description,
                price: service.price,
                currency: service.currency,
                delivery_time: service.delivery_time,
                category: service.category,
                image_url: service.service_image_path || '/images/IT.jpg'
            }));

            return { success: true, data: services };
        } catch (error) {
            console.error('API Error (getServices):', error);
            throw error;
        }
    },

    /**
     * Adds or updates a service
     * @param {FormData} formData 
     * @param {string|null} serviceId 
     */
    async saveService(formData, serviceId = null) {
        try {
            const url = serviceId ? `/api/user/services/${serviceId}` : '/api/user/services';
            const method = serviceId ? 'PATCH' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.message || (errorData.errors && errorData.errors[0]?.msg) || `Failed to ${serviceId ? 'update' : 'add'} service`;
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error (saveService):', error);
            throw error;
        }
    },

    /**
     * Deletes a service
     * @param {string} serviceId 
     */
    async deleteService(serviceId) {
        try {
            const response = await fetch(`/api/user/services/${serviceId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete service');
            return await response.json();
        } catch (error) {
            console.error('API Error (deleteService):', error);
            throw error;
        }
    },

    /**
     * Fetches profile viewers
     */
    async getProfileViewers() {
        try {
            const response = await fetch('/api/user/profile-viewers');
            if (!response.ok) throw new Error('Failed to fetch profile viewers');
            return await response.json();
        } catch (error) {
            console.error('API Error (getProfileViewers):', error);
            throw error;
        }
    },

    /**
     * Updates privacy settings
     * @param {Object} settings 
     */
    async updatePrivacySettings(settings) {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!response.ok) throw new Error('Failed to update privacy settings');
            return await response.json();
        } catch (error) {
            console.error('API Error (updatePrivacySettings):', error);
            throw error;
        }
    },

    /**
     * Logs out the user
     */
    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return await response.json();
        } catch (error) {
            console.error('API Error (logout):', error);
            throw error;
        }
    }
};

window.DashboardAPI = DashboardAPI;
