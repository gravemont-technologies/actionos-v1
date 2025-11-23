# Vercel Environment Variable Setup

## Critical Issue: 401 Errors on Production

If you're seeing 401 authentication errors on the deployed site, it means **Clerk environment variables are not configured in Vercel**.

## Required Environment Variables

Go to your Vercel project settings → Environment Variables and add:

### Frontend Variables (Available to Browser)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c21vb3RoLWNvcmFsLTU0LmNsZXJrLmFjY291bnRzLmRldiQ
```

### Backend Variables (Server-side Only - Mark as Secret)
```
CLERK_SECRET_KEY=sk_test_v2s2j7PiumALsRqXcef7vxImLHq4MrQfjim3QjYAnW
SUPABASE_URL=https://gbfubfltdmddelodnbpu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_vVLntm6rFVir0f4e2LFv4g_1-UBwQJH
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=production
```

## How to Add Variables in Vercel

1. Go to: https://vercel.com/gravemont-technologies/actionos-v1-fork/settings/environment-variables
2. Click "Add New"
3. For each variable:
   - Name: `VITE_CLERK_PUBLISHABLE_KEY`
   - Value: `pk_test_c21vb3RoLWNvcmFsLTU0LmNsZXJrLmFjY291bnRzLmRldiQ`
   - Environments: Check **Production**, **Preview**, and **Development**
4. Click "Save"
5. Repeat for all variables above

## Why This Matters

- **VITE_CLERK_PUBLISHABLE_KEY**: Frontend needs this to initialize Clerk authentication
- **CLERK_SECRET_KEY**: Backend needs this to verify JWT tokens (401 errors without it)
- **SUPABASE_URL/KEY**: Database access for profiles, metrics, and feedback
- **OPENAI_API_KEY**: LLM analysis and step generation

## After Adding Variables

1. Trigger a new deployment:
   ```bash
   git commit --allow-empty -m "trigger rebuild with env vars"
   git push
   ```

2. Or use Vercel dashboard: Deployments → [...] → Redeploy

## Verification

Once deployed with correct environment variables:
- Navigate to `/sign-in`
- Sign in with Clerk
- Should redirect to `/app/analyze` without 401 errors
- Check browser console - no authentication errors

## Common Mistakes

❌ **Don't** add quotes around values in Vercel UI (e.g., `"pk_test_..."` is wrong)  
✅ **Do** paste the raw value (e.g., `pk_test_...` is correct)

❌ **Don't** prefix backend variables with `VITE_` (they won't work server-side)  
✅ **Do** use exact names as shown above

❌ **Don't** forget to select all environments (Production, Preview, Development)  
✅ **Do** check all three boxes for each variable
