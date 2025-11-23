# Clerk JWT Template Setup

## Problem
The backend expects JWT tokens with `userId` and `sid` claims, but Clerk's default tokens don't include these. This causes 401 authentication errors.

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
The backend middleware expects these claims in the JWT:
- **`userId`** (string) - User's unique identifier
- **`sid`** (string) - Session ID

Additional claims like `email`, `firstName`, `lastName` are optional but useful for future features.

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
