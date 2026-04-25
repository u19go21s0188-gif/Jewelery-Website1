# Deployment Guide - Vercel

## Pre-Deployment Checklist

- ✅ All code committed to git
- ✅ Environment variables configured
- ✅ Database migrations applied
- ✅ Admin account created
- ✅ Sample data seeded

## Deploying to Vercel

### Step 1: Prepare Your Repository

Ensure all changes are pushed to GitHub:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select your `jewel-sync` repository
5. Click "Import"

### Step 3: Configure Environment Variables

In the Vercel dashboard, add these environment variables:

```
SUPABASE_URL=https://lyseweefepvnkawfiafw.supabase.co
VITE_SUPABASE_URL=https://lyseweefepvnkawfiafw.supabase.co
VITE_SUPABASE_PROJECT_ID=lyseweefepvnkawfiafw
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5c2V3ZWVmZXB2bmthd2ZpYWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDcxNTcsImV4cCI6MjA5MjUyMzE1N30.q9DX3JO6qffy_N79Zwjr4lrFIPg4wVWeh2S05xv8QeY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5c2V3ZWVmZXB2bmthd2ZpYWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk0NzE1NywiZXhwIjoyMDkyNTIzMTU3fQ.qlKrL0kxWxDj3taqoBKMP2282k2dfeOn3xMl_wbKljY
ADMIN_SIGNUP_CODE=DYqzWhvC7WAVQvU
```

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your project
3. Your site will be live at `your-project.vercel.app`

## Post-Deployment

### Verify Deployment

1. Visit your Vercel URL
2. Test the storefront:
   - Browse products
   - Click "Order on WhatsApp"
   - Test the order form

3. Test admin panel:
   - Navigate to `/auth`
   - Create an admin account with the signup code
   - Access `/admin` dashboard

### Domain Configuration

To connect a custom domain:

1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### CORS Configuration

If you encounter CORS issues, ensure Vercel URL is whitelisted in Supabase:

1. Go to Supabase dashboard
2. Project settings → API
3. Add your Vercel domain to allowed origins

### Monitoring

- **Vercel Dashboard**: Monitor build logs and deployments
- **Supabase Dashboard**: Check database logs and real-time activity
- **Browser Console**: Check for any client-side errors

## Environment Variables Explained

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Backend Supabase project URL |
| `VITE_SUPABASE_URL` | Public Supabase URL for client-side |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public key for client authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for server-side operations |
| `ADMIN_SIGNUP_CODE` | Code required to create admin accounts |

## Production Security Notes

⚠️ **IMPORTANT**: Never commit `.env` to git. The environment variables should only exist in:
- Local `.env` file (not committed)
- Vercel dashboard (production)

## Troubleshooting Deployment

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in `package.json`
- Verify TypeScript compiles: `npm run build` locally

### Environment Variables Not Loading
- Double-check variable names in Vercel match your code
- Ensure `VITE_` prefixed variables are for client-side
- Redeploy after adding new variables

### WhatsApp Integration Not Working
- Verify phone numbers format (should start with country code 91)
- Check browser console for errors
- Ensure Supabase is accessible from production domain

### Admin Dashboard Not Accessible
- Verify you're logged in with correct admin credentials
- Check user has `admin` role in `user_roles` table
- Clear browser cache and cookies

## Updating Your Site

To deploy new changes:

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
4. Vercel automatically detects changes and redeploys

## Performance Tips

- Images are optimized on Supabase bucket
- TanStack Start provides automatic code splitting
- Vercel edge caching improves response times
- Real-time Supabase subscriptions update UI automatically

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check Supabase documentation: https://supabase.com/docs
- Check TanStack Start: https://tanstack.com/start
