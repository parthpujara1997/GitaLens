# Google Authentication Setup Guide

To enable "Sign in with Google" for GitaLens, you need to configure a Google Cloud Project and link it to your Supabase project.

## Step 1: Create Google Cloud Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project** (e.g., "GitaLens Auth").
3. Navigate to **APIs & Services > OAuth consent screen**.
   - Select **External** and click **Create**.
   - Fill in the required fields (App name: "GitaLens", User support email, Developer contact email).
   - Click **Save and Continue** (you can skip Scopes and Test Users for now).
4. Navigate to **APIs & Services > Credentials**.
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - **Application type**: Web application.
   - **Name**: "GitaLens Web Client".
   - **Authorized redirect URIs**: You need the specific URL from Supabase.
     - Go to your Supabase Dashboard > Authentication > Providers > Google.
     - Copy the **Callback URL (for OAuth)** (it looks like `https://<your-project-id>.supabase.co/auth/v1/callback`).
     - Paste this URL into the Authorized redirect URIs field in Google Cloud.
   - Click **Create**.
5. **Copy** the **Client ID** and **Client Secret**.

## Step 2: Configure Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project **parthpujara1997's Project**.
3. Navigate to **Authentication > Providers**.
4. Click on **Google** to expand the settings.
5. Toggle **Enable Sign in with Google** to **ON**.
6. Paste your **Client ID** and **Client Secret** from Step 1.
7. Click **Save**.

## Step 3: Allow Redirect URLs
1. In Supabase, navigate to **Authentication > URL Configuration**.
2. Under **Site URL**, ensure it is set to your production URL (e.g., `https://gitalens.netlify.app`) or `http://localhost:3000` for development.
3. Under **Redirect URLs**, add the following:
   - `http://localhost:3000`
   - `http://localhost:3000/`
   - `https://<your-production-url>.netlify.app` (if you have one)
4. Click **Save**.

## Verification
1. Restart your application (`npm run dev`) if needed.
2. Open the Login Modal in GitaLens.
3. Click "Continue with Google".
4. You should now be redirected to the Google login screen instead of seeing an error.
