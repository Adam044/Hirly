const logger = require('../utils/logger');

class EducationService {
    constructor(pool) {
        this.pool = pool;
    }

    async getUserEducation(userId) {
        const query = 'SELECT * FROM education WHERE user_id = $1 ORDER BY end_date DESC, created_at DESC';
        const result = await this.pool.query(query, [userId]);
        return result.rows;
    }

    async addEducation(userId, data) {
        const {
            type,
            institution_name,
            institution_id,
            title,
            field_of_study,
            education_level,
            start_date,
            end_date,
            is_current,
            grade_score,
            credential_url,
            description
        } = data;

        const query = `
            INSERT INTO education (
                user_id, type, institution_name, institution_id, title,
                field_of_study, education_level, start_date, end_date, is_current,
                grade_score, credential_url, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            userId, type.toLowerCase(), institution_name, institution_id, title,
            field_of_study, education_level, start_date, end_date, is_current || false,
            grade_score, credential_url, description
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async updateEducation(userId, educationId, data) {
        const {
            type,
            institution_name,
            institution_id,
            title,
            field_of_study,
            education_level,
            start_date,
            end_date,
            is_current,
            grade_score,
            credential_url,
            description
        } = data;

        const query = `
            UPDATE education SET
                type = $1,
                institution_name = $2,
                institution_id = $3,
                title = $4,
                field_of_study = $5,
                education_level = $6,
                start_date = $7,
                end_date = $8,
                is_current = $9,
                grade_score = $10,
                credential_url = $11,
                description = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13 AND user_id = $14
            RETURNING *
        `;

        const values = [
            type.toLowerCase(), institution_name, institution_id, title,
            field_of_study, education_level, start_date, end_date, is_current || false,
            grade_score, credential_url, description,
            educationId, userId
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async deleteEducation(userId, educationId) {
        const query = 'DELETE FROM education WHERE id = $1 AND user_id = $2 RETURNING id';
        const result = await this.pool.query(query, [educationId, userId]);
        return result.rowCount > 0;
    }
}

module.exports = EducationService;
