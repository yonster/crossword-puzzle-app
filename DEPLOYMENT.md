# Railway Deployment Guide

This guide will help you deploy the Crossword app to Railway.app for personal use.

## Prerequisites

1. Sign up for a free Railway account at [railway.app](https://railway.app)
2. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Login to Railway:
   ```bash
   railway login
   ```

## Deployment Steps

### 1. Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Railway will automatically detect the `railway.json` configuration

### 2. Deploy from CLI (Alternative)

1. In your project root directory, run:
   ```bash
   railway link
   ```
   
2. Deploy the project:
   ```bash
   railway up
   ```

## Environment Variables

Railway will automatically set up the following environment variables based on your `railway.json`:

- `DATABASE_URL`: Postgres database connection string
- `SECRET_KEY`: Automatically generated secret key
- `ALGORITHM`: JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration (10080 minutes = 7 days)
- `VITE_API_URL`: Frontend API URL pointing to backend service

## Services Configuration

The app consists of:

1. **Backend Service**: FastAPI app with PostgreSQL database
   - Runs on: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check: `/`
   
2. **Frontend Service**: Vite React app
   - Build: `npm install && npm run build`
   - Start: `npm run preview -- --host 0.0.0.0 --port $PORT`
   
3. **PostgreSQL Database**: Automatically provisioned

## Post-Deployment

1. Your app will be available at the URLs provided by Railway
2. Create a user account through the frontend
3. Start importing and solving puzzles!

## Local Development

For local development, the app still uses:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000 (with API proxy to backend)

## Troubleshooting

- Check Railway logs in the dashboard
- Ensure all environment variables are set correctly
- Verify database connectivity
- Check that both services are running

## Costs

Railway offers a generous free tier that should be sufficient for personal use. Monitor your usage in the Railway dashboard.