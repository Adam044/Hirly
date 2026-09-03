# Deployment Instructions (Compute Migration: GCP → Render)

This project is migrating its **compute/application layer** from GCP to **Render**. The existing **Supabase** infrastructure (PostgreSQL database and Storage) remains unchanged.

## 1. Prerequisites
- A **Render** account (render.com).
- Access to the existing **Supabase** project (URL and API Keys).
- Your code pushed to a GitHub/GitLab repository.

## 2. Infrastructure Setup
*   **Database:** We are keeping the existing Supabase database. No migration is required.
*   **Storage:** We are keeping the existing Supabase Storage.
*   **Compute:** We are moving from GCP Cloud Run to Render Web Services.

## 3. Deploy to Render
1. **Connect Repository:** Log in to Render and click **"New +"** -> **"Blueprint"**.
2. **Select Repo:** Connect your GitHub repository containing the Hirly code.
3. **Approve Blueprint:** Render will detect the `render.yaml` file and prepare the `hirly-platform` service.
4. **Environment Variables:** 
   - Render will prompt you for the variables defined in `render.yaml`.
   - **DATABASE_URL:** Use your existing Supabase PostgreSQL connection string (Transaction mode recommended).
   - **SUPABASE_URL / KEYS:** Use your existing Supabase project credentials.
   - **API Keys:** Provide your existing keys for DeepSeek, Jooble, Adzuna, and Email services.
   - **BASE_URL:** The final public URL of your application (e.g., `https://hirly.net`).

## 4. Job Aggregation
- The job aggregator remains **manual**. 
- It is triggered directly from the Hirly Admin Dashboard.
- No automated Cron Jobs are required or configured for this process.

## 5. Verification & Switchover
1. **Deploy to Render:** Allow the first build to complete.
2. **Test:** Access the Render-provided URL and verify that the application connects to the existing Supabase data.
3. **Admin Check:** Verify that the manual job aggregator functions correctly in the new environment.
4. **Final Switch:** Once verified, update your DNS (e.g., in Cloudflare) to point your domain to the Render service.
5. **Decommission GCP:** Only after the Render environment is 100% verified should you stop/delete the GCP Cloud Run service.

## 6. Technical Notes
- **WebSockets:** Render handles `socket.io` natively without additional configuration.
- **Docker:** The included `Dockerfile` ensures all system dependencies (Playwright, Chromium, Sharp) are present.
