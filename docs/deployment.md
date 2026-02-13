# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Vercel account (recommended) or other hosting platform
- GitHub repository

## Environment Setup

### 1. Development Environment

```bash
# Copy environment template
cp .env.development.example .env

# Update with your Supabase credentials
# Edit .env file with your actual values
```

### 2. Staging Environment

1. Create a staging Supabase project
2. Copy `.env.staging.example` to `.env.staging`
3. Update with staging credentials
4. Configure Vercel/hosting platform with staging environment variables

### 3. Production Environment

1. Create a production Supabase project
2. Copy `.env.production.example` to `.env.production`
3. Update with production credentials
4. Configure Vercel/hosting platform with production environment variables

## Deployment Steps

### Vercel Deployment (Recommended)

#### Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### Deploy to Staging

```bash
# Deploy to staging
vercel --env staging

# Or using GitHub Actions (automatic on push to staging branch)
git push origin staging
```

#### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or using GitHub Actions (automatic on push to main branch)
git push origin main
```

### Manual Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The dist/ folder contains the production build
# Upload to your hosting provider
```

## Environment Variables

Configure these in your hosting platform:

### Required Variables

- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_APP_ENV` - Environment name (development/staging/production)

### Optional Variables

- `VITE_SENTRY_DSN` - Sentry DSN for error tracking
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)
- `VITE_ENABLE_ERROR_TRACKING` - Enable error tracking (true/false)
- `VITE_DEBUG` - Enable debug mode (true/false)

## Database Migrations

### Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Create New Migration

```bash
# Create a new migration file
supabase migration new migration_name

# Edit the migration file in supabase/migrations/
# Then push to database
supabase db push
```

## CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment.

### Workflow Triggers

- **Push to `wilber` branch**: Runs tests
- **Push to `staging` branch**: Runs tests + deploys to staging
- **Push to `main` branch**: Runs tests + deploys to production
- **Pull requests**: Runs tests

### Manual Deployment

You can manually trigger deployments from the GitHub Actions tab.

## Rollback Procedure

### Vercel Rollback

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Manual Rollback

1. Identify the last working commit
2. Create a new branch from that commit
3. Deploy the branch to production

```bash
git checkout -b rollback/fix [commit-hash]
git push origin rollback/fix
# Deploy this branch
```

## Monitoring

### Sentry Setup

1. Create a Sentry project
2. Add `VITE_SENTRY_DSN` to environment variables
3. Errors will be automatically tracked in production

### Vercel Analytics

- Automatically enabled for Vercel deployments
- View analytics in Vercel dashboard

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variable Issues

- Ensure all required variables are set
- Variables must start with `VITE_` to be accessible in the app
- Restart dev server after changing .env

### Database Connection Issues

- Verify Supabase credentials
- Check Supabase project status
- Ensure RLS policies are configured correctly

## Security Checklist

- [ ] All secrets are stored in environment variables
- [ ] `.env` files are in `.gitignore`
- [ ] Production uses different credentials than staging/dev
- [ ] HTTPS is enabled on production domain
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Error tracking is configured

## Performance Optimization

- [ ] Images are optimized
- [ ] Code splitting is enabled
- [ ] Bundle size is analyzed
- [ ] CDN is configured for static assets
- [ ] Caching headers are set

## Post-Deployment

1. Verify all pages load correctly
2. Test critical user flows (auth, checkout)
3. Check error tracking dashboard
4. Monitor performance metrics
5. Review logs for any issues
