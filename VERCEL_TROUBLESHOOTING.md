# Vercel Deployment Troubleshooting Guide

## Problem: Works on localhost but not on Vercel

This is the #1 most common issue with Vercel deployments. Here's how to fix it:

---

## Step-by-Step Solution

### 1. **Check if Environment Variables are Set**

Visit your deployed app at:
```
https://your-app.vercel.app/api/debug-env
```

This will show you:
- ✅ Whether your environment variables are detected
- ✅ If there are extra spaces in the values
- ✅ If you're actually running on Vercel
- ✅ Which Vercel environment (production/preview/development)

---

### 2. **Add Environment Variables in Vercel Dashboard**

**This is the most common issue!** Environment variables in your local `.env` file are NOT automatically uploaded to Vercel.

#### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

   **Variable 1:**
   - Key: `OPENSKY_CLIENT_ID`
   - Value: `faysal.alfaleh01@gmail.com-api-client`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Key: `OPENSKY_CLIENT_SECRET`
   - Value: `PnhE71MNW2r9uwxicOVVzQNs7clMA15U`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. **IMPORTANT:** Click "Save" for each variable

---

### 3. **Redeploy Your Application**

After adding environment variables, you MUST redeploy:

**Option A - Via Dashboard:**
1. Go to **Deployments** tab
2. Click the ⋯ menu on the latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache" (faster) or rebuild

**Option B - Via Git:**
1. Push any commit to your repository
2. Vercel will automatically redeploy

**Option C - Via CLI:**
```bash
vercel --prod
```

---

### 4. **Verify Authentication Works**

After redeployment, test your authentication:

```
https://your-app.vercel.app/api/test-auth
```

You should see:
```json
{
  "authenticated": true,
  "message": "✅ OAuth2 authentication successful!",
  ...
}
```

---

## Common Mistakes

### ❌ Mistake #1: Not Redeploying
- Adding env variables doesn't automatically update your deployment
- You MUST redeploy after adding variables

### ❌ Mistake #2: Wrong Environment
- Make sure to select **Production** environment when adding variables
- If testing preview deployments, also select **Preview**

### ❌ Mistake #3: Typos in Variable Names
- Variable names are case-sensitive
- Must be exactly: `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET`

### ❌ Mistake #4: Extra Spaces
- Copy-paste carefully - no spaces before or after values
- Check the `/api/debug-env` endpoint to verify

### ❌ Mistake #5: Using .env.local on Vercel
- Vercel does NOT read `.env` or `.env.local` files
- You must manually add variables in the dashboard

---

## Still Not Working?

### Check Build Logs
1. Go to Vercel Dashboard → Deployments
2. Click on your latest deployment
3. Check the "Build Logs" tab for errors
4. Look for messages about missing environment variables

### Check Function Logs
1. After deployment, visit your app
2. Go back to Vercel Dashboard → Deployments
3. Click "View Function Logs"
4. Look for OAuth2-related errors

### Test Endpoints
Visit these URLs on your deployed app:

1. **Check Environment:**
   ```
   https://your-app.vercel.app/api/debug-env
   ```

2. **Test Authentication:**
   ```
   https://your-app.vercel.app/api/test-auth
   ```

3. **Test Flight Data:**
   ```
   https://your-app.vercel.app/api/flights
   ```

---

## Quick Checklist

- [ ] Environment variables added in Vercel Dashboard
- [ ] Both `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` are set
- [ ] Variables are set for **Production** environment
- [ ] Application was redeployed after adding variables
- [ ] `/api/debug-env` shows `bothSet: true`
- [ ] `/api/test-auth` shows `authenticated: true`
- [ ] No extra spaces in variable values

---

## Local vs Vercel Environment Variables

| Environment | How to Set Variables |
|-------------|---------------------|
| **Local Development** | Create `.env.local` file in project root |
| **Vercel Production** | Dashboard → Settings → Environment Variables |
| **Vercel Preview** | Same as above, but select "Preview" environment |

**Remember:** The `.env` file in your project is for local development only. It is NOT used by Vercel!

---

## Need More Help?

If you're still having issues:
1. Check the `/api/debug-env` output
2. Check the `/api/test-auth` response
3. Review Vercel function logs
4. Make sure your OpenSky credentials are valid at: https://opensky-network.org/my-opensky

