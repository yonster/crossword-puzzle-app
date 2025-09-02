# Railway Deployment Guide

This guide will help you deploy the Crossword app to Railway.app for personal use.

## Quick Fix for Current Deployment Issues

Your current Railway deployment is failing because it needs a PostgreSQL database and proper environment variables. Here's how to fix it:

### Step 1: Add PostgreSQL Database (if not already done)

1. Go to your Railway project at [railway.app](https://railway.app)
2. Click "New" → "Database" → "Add PostgreSQL"
3. Wait for it to provision (about 30 seconds)

### Step 2: Verify Database Connection

Check if `DATABASE_URL` already exists in your service variables. It should look like:
```
postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{PGDATABASE}}
```

If it exists with this format, leave it alone - it's correct!

### Step 3: Add Missing Environment Variables

In your Railway project, go to the service settings and add these variables (if they don't exist):

- `SECRET_KEY`: Generate a random 32-character string (example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
- `ALGORITHM`: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080`

### Step 4: Deploy

Once you add the missing environment variables, click "Deploy" in Railway or it will automatically redeploy. Your app should work once the deployment completes!

## Full Setup Guide

If you want to deploy from scratch:

### Prerequisites

1. Sign up for a free Railway account at [railway.app](https://railway.app)
2. Connect your GitHub account to Railway

### Deployment Steps

1. **Create New Project**:
   - Go to [railway.app](https://railway.app) 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `crossword-puzzle-app` repository

2. **Add PostgreSQL Database**:
   - In your project, click "New" → "Database" → "Add PostgreSQL"
   - Wait for provisioning to complete

3. **Configure Environment Variables**:
   - Click on your main service
   - Go to "Variables" tab
   - Add the variables listed in Step 2 above

4. **Deploy**:
   - Railway will automatically deploy when you push to GitHub
   - Your backend API will be available at the Railway-provided URL

## Current Configuration

The app is currently configured to deploy as a single backend service:

- **Backend Service**: FastAPI app with PostgreSQL database
  - Runs on: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Located in `/backend` directory

- **Frontend**: Can be deployed separately or run locally
  - For local development: `npm run dev` in `/frontend`
  - Points to Railway backend URL via `VITE_API_URL`

## Testing Your Deployment

1. Once deployed, your API will be available at `https://your-app-name.railway.app`
2. Test the health check: `curl https://your-app-name.railway.app/`
3. Create a user via the API or run the frontend locally pointing to your Railway backend

## Local Development

For local development:
- Backend: `cd backend && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm run dev`
- Uses SQLite database locally, PostgreSQL in production

## Troubleshooting

- **Build fails**: Check that `requirements.txt` exists in `/backend` directory
- **Runtime fails**: Ensure DATABASE_URL and SECRET_KEY are set
- **API errors**: Check Railway logs in the dashboard
- **Database connection**: Verify PostgreSQL database is running

## Costs

Railway offers a generous free tier ($5/month of usage) that should be sufficient for personal use.