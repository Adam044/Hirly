const logger = require('../utils/logger');

/**
 * User Service
 * Handles data logic for users and professionals
 */
const userService = {
    /**
     * Update personal info in users table
     */
    async updatePersonalInfo(client, userId, data) {
        logger.info('Updating personal info', { userId, data });
        let { firstName, lastName, phone, city, gender, birthdate } = data;
        
        // Safety guard for city translation keys
        if (city && typeof city === 'string' && city.startsWith('city_')) {
            city = city.replace(/^city_/, '')
                       .split('_')
                       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                       .join(' ');
        }
        
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
 
        if (firstName !== undefined) { updateFields.push(`first_name = $${paramIndex++}`); updateValues.push(firstName); }
        if (lastName !== undefined) { updateFields.push(`last_name = $${paramIndex++}`); updateValues.push(lastName); }
        if (phone !== undefined) { updateFields.push(`phone = $${paramIndex++}`); updateValues.push(phone); }
        if (city !== undefined) { updateFields.push(`city = $${paramIndex++}`); updateValues.push(city); }
        if (gender !== undefined) { updateFields.push(`gender = $${paramIndex++}`); updateValues.push(gender); }
        if (birthdate !== undefined) { updateFields.push(`birthdate = $${paramIndex++}`); updateValues.push(birthdate); }

        if (updateFields.length === 0) {
            logger.warn('No personal fields to update', { userId });
            return null;
        }

        updateValues.push(userId);
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        logger.debug('Executing UPDATE query on users', { query, updateValues });
        const result = await client.query(query, updateValues);
        return result.rows[0];
    },

    /**
     * Update professional profile data in professionals table
     * Uses UPSERT to ensure record exists
     */
    async updateProfessionalData(client, userId, data) {
        logger.info('Updating professional data', { userId, data });
        const { 
            profession, 
            bio, 
            skills, 
            interested_professions, 
            current_status,
            website_link
        } = data;
 
        const updateFields = [];
        const updateValues = [];
        const insertFields = ['user_id'];
        const insertValues = [userId];
        let paramIndex = 1;
 
        const fields = {
            profession, bio, skills, interested_professions, 
            current_status, website_link
        };

        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updateFields.push(`${key} = $${paramIndex++}`);
                updateValues.push(value);
                insertFields.push(key);
                insertValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            logger.warn('No professional fields to update', { userId });
            return null;
        }

        const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
        const doUpdateSet = updateFields.map(field => {
            const colName = field.split(' = ')[0];
            return `${colName} = EXCLUDED.${colName}`;
        }).join(', ');

        const query = `
            INSERT INTO professionals (${insertFields.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (user_id) DO UPDATE SET 
                ${doUpdateSet}
            RETURNING *`;
        
        logger.debug('Executing UPSERT query on professionals', { query, insertValues });
        const result = await client.query(query, insertValues);
        
        logger.info('Professional data saved successfully (UPSERT)', { userId });
        return result.rows[0];
    },

    /**
     * Update privacy settings in professionals table
     * Uses UPSERT to ensure record exists
     * Simplified: privacy_visibility (ALL/companies/none) + privacy_hide_contact_info
     */
    async updatePrivacySettings(client, userId, data) {
        logger.info('Updating privacy settings', { userId, data });
        const { privacy_visibility, privacy_hide_contact_info } = data;

        const updateFields = [];
        const updateValues = [];
        const insertFields = ['user_id'];
        const insertValues = [userId];
        let paramIndex = 1;

        if (privacy_visibility !== undefined) { 
            const val = ['ALL', 'companies', 'none'].includes(privacy_visibility) ? privacy_visibility : 'ALL';
            updateFields.push(`privacy_visibility = $${paramIndex++}`); 
            updateValues.push(val); 
            insertFields.push('privacy_visibility');
            insertValues.push(val);
        }
        if (privacy_hide_contact_info !== undefined) { 
            const val = !!privacy_hide_contact_info;
            updateFields.push(`privacy_hide_contact_info = $${paramIndex++}`); 
            updateValues.push(val); 
            insertFields.push('privacy_hide_contact_info');
            insertValues.push(val);
        }

        if (updateFields.length === 0) {
            logger.warn('No privacy settings to update', { userId });
            return null;
        }

        const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
        const doUpdateSet = updateFields.map(field => {
            const colName = field.split(' = ')[0];
            return `${colName} = EXCLUDED.${colName}`;
        }).join(', ');

        const query = `
            INSERT INTO professionals (${insertFields.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (user_id) DO UPDATE SET 
                ${doUpdateSet}
            RETURNING *`;
        
        logger.debug('Executing UPSERT query on privacy settings', { query, insertValues });
        const result = await client.query(query, insertValues);
        
        logger.info('Privacy settings saved successfully (UPSERT)', { userId });
        return result.rows[0];
    },

    /**
     * Update employer profile data in employers table
     */
    async updateEmployerData(client, userId, data) {
        logger.info('Updating employer data', { userId, data });
        const { 
            companyName, 
            companyDescription, 
            address, 
            employerType, 
            companyEmail, 
            companyPhone, 
            companyCategory,
            website_link
        } = data;

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        const fieldMap = {
            company_name: companyName,
            company_description: companyDescription,
            address: address,
            employer_type: employerType,
            company_email: companyEmail,
            company_phone: companyPhone,
            company_category: companyCategory,
            website_link: website_link
        };

        for (const [colName, value] of Object.entries(fieldMap)) {
            if (value !== undefined) {
                updateFields.push(`${colName} = $${paramIndex++}`);
                updateValues.push(value);
            }
        }

        if (updateFields.length === 0) {
            logger.warn('No employer fields to update', { userId });
            return null;
        }

        updateValues.push(userId);
        const query = `UPDATE employers SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`;
        
        logger.debug('Executing UPDATE query on employers', { query, updateValues });
        const result = await client.query(query, updateValues);
        
        logger.info('Employer data updated successfully', { userId });
        return result.rows[0];
    }
};

module.exports = userService;
