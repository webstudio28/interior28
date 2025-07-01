# Stability AI Setup Instructions

## The Problem
Supabase Edge Functions require secrets to be set using the Supabase CLI, not through the dashboard UI. Environment variables set in the dashboard are NOT automatically available to Edge Functions.

## Solution: Use Supabase CLI to Set Secrets

### Step 1: Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
Replace `YOUR_PROJECT_REF` with your actual project reference (found in your Supabase dashboard URL).

### Step 4: Set the Stability AI API Key as a Secret
```bash
supabase secrets set STABILITY_API_KEY="sk-your-actual-stability-ai-key-here"
```

### Step 5: Set Other Required Secrets
```bash
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 6: Deploy the Edge Function
```bash
supabase functions deploy transform-room
```

### Step 7: Wait for Deployment
Wait 2-3 minutes for the function to fully deploy and pick up the new secrets.

## Verification
Use the "Test API" button in your room details page to verify the configuration is working.

## Important Notes
- Dashboard environment variables DO NOT work for Edge Functions
- You MUST use `supabase secrets set` command
- Secrets are encrypted and only available to your Edge Functions
- After setting secrets, you must redeploy the function
- Changes can take 2-3 minutes to take effect

## Get Your API Keys
- **Stability AI API Key**: https://platform.stability.ai/account/keys
- **Supabase URL**: Project Settings → API → Project URL
- **Service Role Key**: Project Settings → API → Service Role Key (secret)

## Troubleshooting
If you still get "API key not configured" errors:
1. Verify you used `supabase secrets set` (not dashboard env vars)
2. Confirm you redeployed the function after setting secrets
3. Wait the full 2-3 minutes for deployment
4. Check the function logs in your Supabase dashboard
5. Use the Test API button to diagnose the exact issue