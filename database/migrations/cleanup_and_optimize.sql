
-- 1. Remove Old Messaging Logic
DROP TABLE IF EXISTS "Messages" CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- 2. Remove Old Referral Logic from Users
ALTER TABLE users 
    DROP COLUMN IF EXISTS referral_code,
    DROP COLUMN IF EXISTS reffered_by_code,
    DROP COLUMN IF EXISTS has_redeemed_referral_code,
    DROP COLUMN IF EXISTS referred_by_user_id,
    DROP COLUMN IF EXISTS has_received_referral_bonus,
    DROP COLUMN IF EXISTS referred_by_code;

-- 3. Remove Old Urgent Jobs Logic
ALTER TABLE jobs DROP COLUMN IF EXISTS is_urgent;

-- 4. Remove Redundant Professional Columns
ALTER TABLE professionals DROP COLUMN IF EXISTS current_profession;

-- 5. Data Type Fixes (Dates)
-- Convert jobs.deadline to DATE
ALTER TABLE jobs 
    ALTER COLUMN deadline TYPE DATE 
    USING (CASE WHEN deadline::TEXT ~ '^\d{4}-\d{2}-\d{2}' THEN deadline::DATE ELSE NULL END);

-- Convert education dates to DATE
ALTER TABLE education 
    ALTER COLUMN start_date TYPE DATE 
    USING (CASE 
        WHEN start_date::TEXT ~ '^\d{4}-\d{2}-\d{2}' THEN start_date::DATE 
        WHEN start_date::TEXT ~ '^\d{4}$' THEN (start_date::TEXT || '-01-01')::DATE 
        ELSE NULL 
    END);

ALTER TABLE education 
    ALTER COLUMN end_date TYPE DATE 
    USING (CASE 
        WHEN end_date::TEXT ~ '^\d{4}-\d{2}-\d{2}' THEN end_date::DATE 
        WHEN end_date::TEXT ~ '^\d{4}$' THEN (end_date::TEXT || '-01-01')::DATE 
        ELSE NULL 
    END);
