# Gitpluse - GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for the Gitpluse feature.

## Prerequisites
- A GitHub account
- Your Vectora application running locally or deployed

## Step 1: Register GitHub OAuth Application

1. Go to your GitHub account settings:
   - Navigate to **Settings** > **Developer settings** > **OAuth Apps**
   - Click **"New OAuth App"**

2. Fill in the OAuth App registration form:
   - **Application name**: `Vectora Gitpluse` (or your preferred name)
   - **Homepage URL**: `http://localhost:5173` (or your frontend URL)
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback` (or your backend callback URL)
   - Click **"Register application"**

3. After registration, you'll get:
   - **Client ID**
   - **Client Secret** (click "Generate a new client secret")

## Step 2: Update Environment Variables

### Backend (.env)
Update your `backend/.env` file with the credentials you obtained:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
FRONTEND_URL=http://localhost:5173
```

### Replace values:
- `your_github_client_id_here` - Your Client ID from GitHub
- `your_github_client_secret_here` - Your Client Secret from GitHub
- Update URLs if your application is deployed

## Step 3: Verify Backend Routes

The following routes have been automatically added:

- `GET /api/auth/github` - Initiates GitHub OAuth flow
- `GET /api/auth/github/callback` - Handles OAuth callback from GitHub

## Step 4: Frontend Components

The Gitpluse page has been added with the following features:
- GitHub OAuth login button
- User profile display after authentication
- Repository statistics
- Disconnect functionality

## Step 5: Testing

1. **Start your backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start your frontend**:
   ```bash
   cd fr
   npm run dev
   ```

3. **Navigate to Dashboard**:
   - Go to `http://localhost:5173/dashboard`
   - Click on the "Gitpluse" quick action card
   - Click "Sign in with GitHub"
   - Authorize the application when prompted
   - You'll be redirected back to your profile with GitHub data

## Deployment Updates

When deploying to production:

1. **Update GitHub OAuth App**:
   - Go to your GitHub OAuth App settings
   - Update the "Authorization callback URL" to match your production backend URL
   - Example: `https://yourdomain.com/api/auth/github/callback`

2. **Update .env in production**:
   ```env
   GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback
   FRONTEND_URL=https://yourdomain.com
   ```

## Data Stored

When a user authenticates via GitHub, the following data is stored:
- GitHub User ID
- GitHub Username
- GitHub Profile URL
- GitHub Access Token (securely stored)

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret private
- Access tokens are stored securely in the database
- The password field is ignored for GitHub OAuth users

## Troubleshooting

### "Failed to get access token"
- Verify your Client ID and Client Secret are correct
- Check that the callback URL matches exactly in both GitHub settings and .env

### "No authorization code provided"
- Ensure the OAuth redirect URL is correct
- Check browser console for error messages

### CORS Issues
- Verify your backend is allowing requests from your frontend URL
- Update CORS configuration if needed

## Database Schema

GitHub fields have been added to the User model:
```javascript
githubId          // Unique GitHub user ID
githubUsername    // GitHub username
githubProfileUrl  // Link to GitHub profile
githubAccessToken // OAuth access token (secure)
```

## API Endpoints Reference

### Get GitHub OAuth URL
```
GET /api/auth/github
Response: { authUrl: "https://github.com/login/oauth/authorize?..." }
```

### OAuth Callback (Automatic)
```
GET /api/auth/github/callback?code=xxx
Returns: Redirect to /gitpluse with JWT token
```

---

For questions or issues, check the GitHub documentation: https://docs.github.com/en/developers/apps/building-oauth-apps
