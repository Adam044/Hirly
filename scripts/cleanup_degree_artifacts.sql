-- Hirly Degree Field Cleanup Script
-- This script removes legacy 'yes', 'no', 'true', 'false' artifacts from the degree field.

-- 1. Remove "yes", "no", "true", "false" followed by any separators like "•", "-", " ", or "."
-- This uses regex to find these patterns at the start of the string (case-insensitive)
UPDATE freelancers 
SET degree = REGEXP_REPLACE(degree, '^(yes|no|true|false)\s*([•\-\. ]+)\s*', '', 'i')
WHERE degree ~* '^(yes|no|true|false)\s*([•\-\. ]+)\s*';

-- 2. Clean up any cases where the degree is JUST "yes", "no", etc. (setting to NULL)
UPDATE freelancers
SET degree = NULL
WHERE degree ~* '^(yes|no|true|false)$';

-- 3. Trim any accidental leading/trailing whitespace after the cleanup
UPDATE freelancers
SET degree = TRIM(degree)
WHERE degree IS NOT NULL;
