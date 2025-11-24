# Clerk JWT Template Setup

## Problem
The backend now validates Clerk-issued JWTs via JWKS and relies on the token's `sub` claim for the authenticated user. Clerk includes `sub` by default, but our tooling benefits from a few extra aliased claims (like `userId`) and, when present, the session identifier. If your template omits these helpful claims you lose observability data and may see confusing log output during debugging.

## Solution: Create Custom JWT Template

### Step 1: Access Clerk Dashboard
1. Go to https://dashboard.clerk.com/
2. Select your application: **smooth-coral-54** (or your app name)

### Step 2: Create JWT Template
1. In sidebar, navigate to: **Configure** → **JWT Templates**
2. Click **"New template"**
3. Enter these details:
    - **Name:** `actionos`
    - **Template type:** Blank
    - **Claims:**
    ```json
    {
       "userId": "{{user.id}}",
       "sid": "{{session.id}}",
       "email": "{{user.primary_email_address}}",
       "firstName": "{{user.first_name}}",
       "lastName": "{{user.last_name}}"
    }
    ```
    > ℹ️ The backend only requires the standard `sub` claim, which Clerk sets automatically. Including `sid` is optional but keeps parity with legacy logs; if you drop it the API will fall back to the token `jti` instead.
4. Click **"Save"**

### Step 3: Verify Template Name
The frontend code is configured to use template name: **`actionos`**

If you choose a different name, update this line in `src/ui/auth.ts`:
```typescript
const token = await getToken({ template: 'actionos' }); // Change 'actionos' to your template name
```

### Step 4: Test
1. Deploy the changes
2. Sign in to the app
3. Check browser console - you should see:
   - `[useAuthState] Token result: { hasToken: true, tokenLength: xxx }`
   - No more 401 errors on `/api/auth/status`

## Required Claims
The middleware enforces only the standard JWT subject:
- **`sub`** (string) – Provided by Clerk automatically and mapped to `res.locals.userId`

Optional but recommended:
- **`userId`** (string) – Mirrors `sub` for easier debugging in logs
- **`sid`** (string) – Session identifier surfaced in metrics when available (falls back to `jti` if omitted)
- **Profile data** – `email`, `firstName`, `lastName` remain handy for future product work but are not required.

## Troubleshooting

### If you still get 401 errors:
1. **Clear browser cache/cookies** - old tokens might be cached
2. **Sign out and sign in again** - force new token generation
3. **Check template name matches** - frontend calls `getToken({ template: 'actionos' })`
4. **Verify claims in JWT** - decode token at https://jwt.io to inspect claims

### If getToken() returns null:
- User might not be authenticated (session expired)
- Clerk provider not properly initialized
- Template name mismatch (returns null if template doesn't exist)
