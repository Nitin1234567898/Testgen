# Supabase Edge Function Setup Guide

This guide will help you set up the Supabase Edge Function to integrate Gemini AI with your frontend.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Gemini API key (get one from https://makersuite.google.com/app/apikey)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for the project to be fully initialized

## Step 2: Set Up Environment Variables

1. In your Supabase dashboard, go to **Project Settings** > **Edge Functions** > **Secrets**
2. Add a new secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (from Google AI Studio)

## Step 3: Deploy the Edge Function

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (You can find your project ref in the Supabase dashboard URL)

4. Deploy the function:
   ```bash
   supabase functions deploy generate-test
   ```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Create a new function**
3. Name it `generate-test`
4. Copy and paste the contents of `supabase-edge-function/generate-test/index.ts` into the editor
5. Click **Deploy**

## Step 4: Configure Frontend Environment Variables

1. Create a `.env` file in your project root:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Get these values from:
   - Supabase Dashboard > **Project Settings** > **API**
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Step 5: Test the Integration

1. Start your frontend: `npm run dev`
2. Enter a test description (e.g., "Test user login functionality")
3. Click "Generate Java Test Case"
4. You should see the generated test steps and code from Gemini AI

## Troubleshooting

### Error: "GEMINI_API_KEY is not set"
- Make sure you've added the secret in Supabase dashboard
- Verify the secret name is exactly `GEMINI_API_KEY`

### Error: "Function not found"
- Make sure the function is deployed and named `generate-test`
- Check that your Supabase project URL is correct

### CORS Errors
- The edge function includes CORS headers, but if you still see errors:
  - Check that your frontend URL is allowed in Supabase settings
  - Verify the function is deployed correctly

### API Key Issues
- Make sure your Gemini API key is valid
- Check if there are any usage limits on your API key

## Edge Function Code

The edge function code is located at:
```
supabase-edge-function/generate-test/index.ts
```

This file contains:
- Gemini AI integration
- Error handling
- CORS configuration
- JSON response parsing

## Next Steps

- Add rate limiting to prevent abuse
- Add authentication if needed
- Store generated test cases in Supabase database
- Add logging for debugging

