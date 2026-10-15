Direct job access credentials
=============================

The Render blueprint provisions `DIRECT_ACCESS_SECRET` and runs the database migration before deployment. For an existing service, ensure the updated blueprint is applied or configure the secret and run the migration manually. Preserve any existing `DIRECT_ACCESS_SECRET`; replacing it prevents retrieval of previously encrypted passwords.

Run `node scripts/migrate-direct-access.js` against the target database before deploying this change, or apply `supabase/migrations/add_encrypted_access_key_to_jobs.sql` directly. It adds the `jobs.access_key_encrypted` text column, now used for encrypted credentials. Verification continues to use `access_key_hash`.

Set a dedicated, persistent `DIRECT_ACCESS_SECRET` of at least 32 bytes in the deployment secret store. Generate it once with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Session secrets are never used for credential encryption. New provisioning and password replacement fail without this configuration; existing password verification still works. If the earlier implementation has already stored credentials using SESSION_SECRET, set DIRECT_ACCESS_SECRET to that former value before switching so those credentials remain readable. Do not change the encryption secret without migrating encrypted credentials; existing password hashes will still verify, but saved passwords will no longer be readable by the admin dashboard.

Opening the modal reads saved credentials. Provisioning an already configured job preserves its password. Only choosing Replace Password, acknowledging the effect, and saving sends an explicit rotation request. The link is based on the job ID and does not change when the password changes.

Older hash-only passwords stay valid. Their original text cannot be recovered; admins can continue sharing previously saved details or explicitly set a new password once to enable retrieval.

Run regression checks with `node --test tests/direct-access.test.js tests/direct-access-browser.test.js`. These tests use a simulated database and do not modify live jobs.

Concurrency tests simulate PostgreSQL row locking; they do not replace a deployment check against PostgreSQL. Browser checks use the actual modal markup and JavaScript with mocked HTTP responses.
