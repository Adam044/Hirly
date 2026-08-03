const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthService {
    constructor(pool, supabaseAdmin) {
        this.pool = pool;
        this.supabaseAdmin = supabaseAdmin;
    }

    slugify(text) {
        if (!text) return '';
        return text.toString().toLowerCase().trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0621-\u064A-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    async generateUniqueSlug(client, baseName) {
        let baseSlug = this.slugify(baseName) || 'user';
        let finalSlug = baseSlug;
        let counter = 1;

        while (true) {
            const check = await client.query('SELECT id FROM users WHERE slug = $1', [finalSlug]);
            if (check.rows.length === 0) break;
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }
        return finalSlug;
    }

    async registerUser(userData, sendVerificationEmail) {
        let client;
        let authUserUuid = null;
        try {
            client = await this.pool.connect();
            const {
                firstName, lastName, email, phone, city, password,
                userType, employerType, interests, currentStatus, mainProfession, mainCategory,
                studentType, universityYear, schoolGrade,
                companyName, companyEmail, companyPhone, address, companyDescription, companyCategory,
                gender, birthdate, website_link, degree, degree_field, university
            } = userData;

            let emailToAuthWith = email;
            if (userType === 'employer' && employerType === 'company') {
                emailToAuthWith = companyEmail;
            }

            // Check App DB
            const userExistsInAppDb = await client.query('SELECT id FROM users WHERE email = $1', [emailToAuthWith]);
            if (userExistsInAppDb.rows.length > 0) {
                const err = new Error('Email already registered in our system. Please try logging in.');
                err.statusCode = 409;
                throw err;
            }

            // Check Supabase Auth
            const { data: existingAuthUsers, error: listAuthError } = await this.supabaseAdmin.auth.admin.listUsers({ email: emailToAuthWith });
            if (listAuthError) {
                const err = new Error('Failed to check user existence with authentication provider.');
                err.statusCode = 500;
                throw err;
            }
            if (existingAuthUsers.users.length > 0) {
                const existingAuthUser = existingAuthUsers.users[0];
                if (existingAuthUser.email_confirmed_at) {
                    const err = new Error('Email already registered and verified.');
                    err.statusCode = 409;
                    throw err;
                } else {
                    // Cleanup unverified stale account
                    await this.supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
                }
            }

            // Create Supabase User
            const { data: authUserData, error: createUserError } = await this.supabaseAdmin.auth.admin.createUser({
                email: emailToAuthWith,
                password: password,
                email_confirm: false,
                user_metadata: {
                    user_type: userType,
                    employer_type: userType === 'employer' ? employerType : undefined
                }
            });

            if (createUserError) {
                const err = new Error('Failed to create user account with authentication provider.');
                err.statusCode = 500;
                throw err;
            }

            authUserUuid = authUserData.user.id;
            const passwordHash = await bcrypt.hash(password, 10);

            await client.query('BEGIN');

            // Prepare User Record
            let userFirstName = firstName;
            let userLastName = lastName;
            let userPhone = phone;
            let userCity = city;

            if (userType === 'employer' && employerType === 'company') {
                userFirstName = companyName || 'Company';
                userLastName = '';
                userPhone = companyPhone;
                userCity = address ? address.split(',')[0] : '';
            }

            let baseName = (userType === 'employer' && employerType === 'company') ? companyName : `${firstName} ${lastName}`;
            let finalSlug = await this.generateUniqueSlug(client, baseName);

            // Insert User
            const userInsertResult = await client.query(
                'INSERT INTO users (first_name, last_name, email, phone, city, password_hash, user_type, is_email_verified, auth_user_id, gender, birthdate, website_link, slug) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9, $10, $11, $12) RETURNING id',
                [userFirstName, userLastName, emailToAuthWith, userPhone, userCity, passwordHash, userType, authUserUuid, gender, birthdate, website_link, finalSlug]
            );
            const userId = userInsertResult.rows[0].id;

            // Insert Role-Specific Records
            if (userType === 'professional' || userType === 'freelancer') {
                const rawInterests = interests ? (typeof interests === 'string' ? JSON.parse(interests) : interests) : null;
                const parsedInterests = Array.isArray(rawInterests) ? rawInterests.slice(0, 5) : rawInterests;

                await client.query(
                    'INSERT INTO professionals (user_id, current_status, profession, interested_professions, student_type, study_status, school_grade, verification_status, degree, degree_field, university) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11)',
                    [
                        userId, 
                        currentStatus, 
                        mainProfession || null, 
                        parsedInterests ? JSON.stringify(parsedInterests) : null, 
                        studentType || null,
                        universityYear || null, // Storing university year in study_status
                        schoolGrade || null,
                        'Verified', 
                        degree || null, 
                        degree_field || null, 
                        university || null
                    ]
                );
            } else if (userType === 'employer') {
                if (employerType === 'individual') {
                    await client.query(
                        'INSERT INTO employers (user_id, employer_type, company_email, company_phone, verification_status) VALUES ($1, $2, $3, $4, $5)',
                        [userId, employerType, emailToAuthWith, phone, 'Verified']
                    );
                } else if (employerType === 'company') {
                    await client.query(
                        'INSERT INTO employers (user_id, company_name, company_description, address, employer_type, company_email, company_phone, company_category, verification_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                        [userId, companyName, companyDescription, address, employerType, companyEmail, companyPhone, companyCategory, 'Verified']
                    );
                }
            }

            // Generate Verification Token
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
            await client.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, verificationCode, expiresAt]);

            await sendVerificationEmail(emailToAuthWith, verificationCode);
            await client.query('COMMIT');

            return { email: emailToAuthWith };
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            if (authUserUuid) {
                await this.supabaseAdmin.auth.admin.deleteUser(authUserUuid).catch(() => { });
            }
            throw error;
        } finally {
            if (client) client.release();
        }
    }

    async loginUser(email, password, sendVerificationEmail) {
        let client;
        const normalizedEmail = (email || '').trim().toLowerCase();

        try {
            client = await this.pool.connect();
            const userResult = await client.query('SELECT id, password_hash, user_type, is_email_verified, auth_user_id, email AS db_email FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
            const user = userResult.rows[0];

            if (!user) {
                const err = new Error('Invalid credentials: Email not found.');
                err.statusCode = 401;
                throw err;
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                const err = new Error('Invalid credentials: Incorrect password.');
                err.statusCode = 401;
                throw err;
            }

            if (user.is_email_verified === false) {
                try {
                    await client.query('BEGIN');
                    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
                    const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
                    await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [user.id]);
                    await client.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, newToken, newExpiry]);
                    await sendVerificationEmail(user.db_email, newToken);
                    await client.query('COMMIT');
                } catch (emailError) {
                    if (client) await client.query('ROLLBACK');
                    const err = new Error('An error occurred. Please try again later.');
                    err.statusCode = 500;
                    throw err;
                }

                const err = new Error('Email not verified. A new verification code has been sent. Please check your inbox.');
                err.statusCode = 403;
                err.redirect = `/email_verification_pending.html?email=${encodeURIComponent(user.db_email)}`;
                throw err;
            }

            if (user.user_type === 'freelancer') {
                user.user_type = 'professional';
            }
            return user;
        } finally {
            if (client) client.release();
        }
    }
}

module.exports = AuthService;
