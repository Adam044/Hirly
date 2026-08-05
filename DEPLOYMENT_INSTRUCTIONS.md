# Deployment Instructions

## Environment Details
- **Project ID:** `hirly-467516`
- **Artifact Repo Name:** `hirly-repo`
- **Region:** `europe-west1`
- **Port:** `8080`

## Deployment Steps

### 1. Build and Push Image
Run the following command to build the Docker image using Google Cloud Build and push it to Google Container Registry (GCR):

```bash
gcloud builds submit --tag gcr.io/hirly-467516/hirly-repo
```

### 2. Deploy to Cloud Run
Run the following command to deploy the image from GCR to Google Cloud Run:

```bash
gcloud run deploy hirly-repo \
  --image gcr.io/hirly-467516/hirly-repo \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --project hirly-467516 \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```


gcloud scheduler jobs create http daily-job-scrape `
  --schedule="0 3 * * *" `
  --uri="https://hirly.net/api/cron/trigger-scrape?secret=cgrgu66b7d2d4sg459a8c1f2e4d6c8b0f71a7gks7c2" `
  --http-method=GET `
  --location=europe-west1

  test