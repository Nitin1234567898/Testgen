# Quick Fix: Deploy Edge Function

The error "Failed to send a request to the Edge Function" means the function hasn't been deployed yet.

## Quick Steps to Deploy:

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/bfmlmpbrwlzpcmcmplgy
2. **Navigate to Edge Functions** (left sidebar)
3. **Click "Create a new function"**
4. **Name it**: `generate-test` (exactly this name)
5. **Copy the code** from `supabase-edge-function/generate-test/index.ts` or `EDGE_FUNCTION_CODE.md`
6. **Paste it** into the code editor
7. **Click "Deploy"**

### Option 2: Add Gemini API Key Secret

Before or after deploying, you need to add the secret:

1. **Go to**: Project Settings → Edge Functions → Secrets
2. **Click "Add new secret"**
3. **Name**: `GEMINI_API_KEY`
4. **Value**: Your Gemini API key (from https://makersuite.google.com/app/apikey)
5. **Save**

### Option 3: Verify Deployment

After deploying, you can test the function directly in Supabase:
1. Go to Edge Functions → `generate-test`
2. Click "Invoke" or "Test"
3. Try with test data: `{"description": "test login"}`

## After Deployment:

1. **Restart your dev server** (if it's running):
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Try generating a test case again**

The improved error handling will now show you:
- If the function doesn't exist (404 error)
- If the API key is missing
- If there are other configuration issues

## Still Having Issues?

Check the browser console (F12) for more detailed error messages. The new code will show exactly what's wrong.

