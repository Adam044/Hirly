const crypto = require('crypto');
const logger = require('../utils/logger');

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

    /**
     * Strips 'city_' and 'country_' prefixes from location strings
     */
    cleanLocation(text) {
        if (!text) return '';
        // If it looks like a translation key (city_xxx or country_xxx), we should try to clean it
        // However, the best cleanup is actually done in the SQL cleanup script and frontend fix.
        // This is a safety guard.
        if (typeof text !== 'string') return text;
        
        // If it starts with city_ or country_, it's definitely a translation key
        if (text.startsWith('city_') || text.startsWith('country_')) {
            // Strip prefix and replace underscores with spaces, then capitalize
            return text.replace(/^(city_|country_)/, '')
                       .split('_')
                       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                       .join(' ');
        }
        return text;
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
                firstName, lastName, email, phone, country, city, password,
                userType, employerType, interests, currentStatus, mainProfession, mainCategory,
                studentType, universityYear, schoolGrade,
                companyName, companyEmail, companyPhone, address, companyDescription, companyCategory,
                gender, birthdate, website_link, degree, degree_field, university,
                claimJobId
            } = userData;

            let emailToAuthWith = (email || '').trim().toLowerCase();
            if (userType === 'employer' && employerType === 'company') {
                emailToAuthWith = (companyEmail || '').trim().toLowerCase();
            }

            // Check App DB
            const userExistsInAppDb = await client.query('SELECT id FROM users WHERE email = $1', [emailToAuthWith]);
            if (userExistsInAppDb.rows.length > 0) {
                const err = new Error('Email already registered in our system. Please try logging in.');
                err.statusCode = 409;
                throw err;
            }

            // Check Supabase Auth
            let existingAuthUser = null;
            let page = 1;
            const perPage = 1000;
            
            while (true) {
                const { data: { users }, error: listAuthError } = await this.supabaseAdmin.auth.admin.listUsers({
                    page: page,
                    perPage: perPage
                });
                
                if (listAuthError) {
                    const err = new Error('Failed to check user existence with authentication provider.');
                    err.statusCode = 500;
                    throw err;
                }
                
                if (!users || users.length === 0) break;
                
                existingAuthUser = users.find(u => u.email && u.email.toLowerCase() === emailToAuthWith);
                if (existingAuthUser) break;
                
                if (users.length < perPage) break;
                page++;
            }
            
            if (existingAuthUser) {
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
                email_confirm: true, // Set to true so login (password check) works immediately
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

            await client.query('BEGIN');

            // Prepare User Record
            let userFirstName = firstName;
            let userLastName = lastName;
            let userPhone = phone;
            let userCountry = this.cleanLocation(country);
            let userCity = this.cleanLocation(city);

            if (userType === 'employer' && employerType === 'company') {
                userFirstName = companyName || 'Company';
                userLastName = '';
                userPhone = companyPhone;
                // Use the provided country if available, otherwise fallback
                if (country) {
                    userCountry = this.cleanLocation(country);
                }
                userCity = ''; // City removed for companies
            }

            let baseName = (userType === 'employer' && employerType === 'company') ? companyName : `${firstName} ${lastName}`;
            let finalSlug = await this.generateUniqueSlug(client, baseName);

            // Insert User (Removed password_hash, website_link, and tier columns)
            const userInsertResult = await client.query(
                'INSERT INTO users (first_name, last_name, email, phone, country, city, user_type, is_email_verified, auth_user_id, gender, birthdate, slug) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9, $10, $11) RETURNING id',
                [userFirstName, userLastName, emailToAuthWith, userPhone, userCountry, userCity, userType, authUserUuid, gender, birthdate, finalSlug]
            );
            const userId = userInsertResult.rows[0].id;

            // Insert Role-Specific Records
            if (userType === 'professional') {
                const rawInterests = interests ? (typeof interests === 'string' ? JSON.parse(interests) : interests) : null;
                const parsedInterests = Array.isArray(rawInterests) ? rawInterests.slice(0, 5) : rawInterests;

                await client.query(
                    'INSERT INTO professionals (user_id, current_status, profession, interested_professions, verification_status, website_link) VALUES ($1, $2, $3, $4::jsonb, $5, $6)',
                    [
                        userId, 
                        currentStatus, 
                        mainProfession || null, 
                        parsedInterests ? JSON.stringify(parsedInterests) : null, 
                        'Verified',
                        website_link || null
                    ]
                );

                // Insert into education table if it's a student or has degree info
                if (currentStatus === 'Student' && studentType) {
                    const type = studentType.toLowerCase() === 'university' ? 'university' : 'school';
                    const title = studentType.toLowerCase() === 'university' ? (universityYear ? `${universityYear} Year` : 'Student') : (schoolGrade ? `${schoolGrade} Grade` : 'Student');
                    const institutionName = studentType.toLowerCase() === 'university' ? (university || 'University') : 'School';
                    
                    await client.query(
                        'INSERT INTO education (user_id, type, institution_name, title, is_current) VALUES ($1, $2, $3, $4, TRUE)',
                        [userId, type, institutionName, title]
                    );
                } else if (degree || university) {
                     await client.query(
                        'INSERT INTO education (user_id, type, institution_name, title, field_of_study) VALUES ($1, $2, $3, $4, $5)',
                        [userId, 'university', university || 'University', degree || 'Graduate', degree_field || null]
                    );
                }
            } else if (userType === 'employer') {
                if (employerType === 'individual') {
                    await client.query(
                        'INSERT INTO employers (user_id, employer_type, company_email, company_phone, verification_status, website_link) VALUES ($1, $2, $3, $4, $5, $6)',
                        [userId, employerType, emailToAuthWith, phone, 'Verified', website_link || null]
                    );
                } else if (employerType === 'company') {
                    await client.query(
                        'INSERT INTO employers (user_id, company_name, company_description, address, employer_type, company_email, company_phone, company_category, verification_status, website_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                        [userId, companyName, companyDescription, address, employerType, companyEmail, companyPhone, companyCategory, 'Verified', website_link || null]
                    );
                }
            }

            // Generate Verification Token
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
            await client.query('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, verificationCode, expiresAt]);

            // --- Phase 5: Claim Job Logic ---
            if (claimJobId && userType === 'employer') {
                await client.query(
                    'UPDATE jobs SET employer_id = $1 WHERE id = $2 AND is_external = true',
                    [userId, claimJobId]
                );
                logger.info(`Job ${claimJobId} claimed by new employer ${userId}`);
            }

            await sendVerificationEmail(emailToAuthWith, verificationCode);
            await client.query('COMMIT');

            return { email: emailToAuthWith, claimJobId: claimJobId || null };
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
            // 1. Verify credentials with Supabase Auth
            const { data: authData, error: authError } = await this.supabaseAdmin.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });

            if (authError) {
                // Check if user exists in local DB but isn't in Supabase yet
                client = await this.pool.connect();
                const localUserCheck = await client.query('SELECT id, auth_user_id FROM users WHERE email = $1', [normalizedEmail]);
                
                if (localUserCheck.rows.length > 0 && !localUserCheck.rows[0].auth_user_id) {
                    const err = new Error('Your account requires a one-time security activation.');
                    err.statusCode = 401;
                    err.needsActivation = true;
                    throw err;
                }

                const err = new Error('Invalid credentials.');
                err.statusCode = 401;
                throw err;
            }

            // 2. Fetch local user data
            client = await this.pool.connect();
            const userResult = await client.query('SELECT id, user_type, is_email_verified, auth_user_id, email AS db_email FROM users WHERE auth_user_id = $1', [authData.user.id]);
            const user = userResult.rows[0];

            if (!user) {
                const err = new Error('User record not found in local database.');
                err.statusCode = 404;
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

    async resetPassword(userId, newPassword) {
        let client;
        try {
            client = await this.pool.connect();
            
            // 1. Get user details from local DB
            const userResult = await client.query('SELECT auth_user_id, email, user_type FROM users WHERE id = $1', [userId]);
            const user = userResult.rows[0];
            
            if (!user) {
                throw new Error('User not found.');
            }

            // 2. If user doesn't have an auth_user_id or is missing from Supabase, create/re-create them
            let authId = user.auth_user_id;
            let needsCreation = !authId;

            if (authId) {
                const { data: { user: authUser }, error: getError } = await this.supabaseAdmin.auth.admin.getUserById(authId);
                if (getError || !authUser) {
                    needsCreation = true;
                }
            }

            if (needsCreation) {
                // Create the user in Supabase Auth
                const { data: createData, error: createError } = await this.supabaseAdmin.auth.admin.createUser({
                    email: user.email,
                    password: newPassword,
                    email_confirm: true,
                    user_metadata: { user_type: user.user_type }
                });

                if (createError) {
                    throw new Error(`Migration failed: ${createError.message}`);
                }

                authId = createData.user.id;
                // Update local DB with the new auth_user_id
                await client.query('UPDATE users SET auth_user_id = $1 WHERE id = $2', [authId, userId]);
            } else {
                // User exists in Supabase, just update the password
                const { error: updateError } = await this.supabaseAdmin.auth.admin.updateUserById(
                    authId,
                    { password: newPassword }
                );

                if (updateError) {
                    throw new Error('Failed to update password with authentication provider.');
                }
            }

            return { success: true };
        } finally {
            if (client) client.release();
        }
    }
}

module.exports = AuthService;
