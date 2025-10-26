# Production Deployment Guide
**AI Resume Optimizer Platform**  
**Last Updated**: October 26, 2025

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Production Database Setup](#production-database-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to production, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account (free tier available)
- [ ] Production PostgreSQL database (Vercel Postgres, Neon, or Supabase)
- [ ] Domain name (optional, but recommended)
- [ ] All security audit items completed
- [ ] Application tested locally

---

## Production Database Setup

### Option 1: Vercel Postgres (Recommended)

**Advantages**: Seamless integration, automatic backups, free tier available

**Steps**:

1. **Create Vercel Postgres Database**
   ```bash
   # From Vercel Dashboard:
   # 1. Go to Storage tab
   # 2. Click "Create Database"
   # 3. Select "Postgres"
   # 4. Choose region closest to your users
   # 5. Select plan (Hobby for development, Pro for production)
   ```

2. **Get Connection String**
   ```bash
   # Vercel will provide:
   # - POSTGRES_URL (for Prisma)
   # - POSTGRES_URL_NON_POOLING (for migrations)
   ```

3. **Configure Environment Variables** (see below)

4. **Run Migrations**
   ```bash
   # Using Vercel CLI
   npx vercel env pull .env.local
   npx prisma migrate deploy
   
   # Or set DATABASE_URL and run locally
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

### Option 2: Neon

**Advantages**: Serverless Postgres, generous free tier, branch databases

**Steps**:

1. **Create Neon Database**
   - Go to [https://neon.tech](https://neon.tech)
   - Sign up and create a new project
   - Copy the connection string

2. **Connection String Format**
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

3. **Run Migrations** (same as Vercel Postgres above)

### Option 3: Supabase

**Advantages**: Full backend platform, real-time capabilities, generous free tier

**Steps**:

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings > Database
   - Copy connection string (use "connection pooling" URL)

2. **Connection String Format**
   ```
   postgresql://postgres:[password]@[host]:6543/postgres
   ```

3. **Run Migrations** (same as above)

---

## Environment Variables Configuration

### Production Environment Variables

Create these environment variables in your Vercel project:

```bash
# Database Configuration
DATABASE_URL="your-production-database-url"

# Authentication
NEXTAUTH_SECRET="your-production-secret-32-chars-min"
NEXTAUTH_URL="https://your-domain.com"

# API Key Encryption
ENCRYPTION_KEY="your-production-encryption-key-32-chars-min"

# Optional: Node Environment
NODE_ENV="production"
```

### Generating Secure Secrets

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

**Generate ENCRYPTION_KEY**:
```bash
openssl rand -hex 32
```

### Adding Environment Variables to Vercel

**Method 1: Vercel Dashboard**
1. Go to your project settings
2. Click "Environment Variables"
3. Add each variable with appropriate environment (Production, Preview, Development)
4. Save changes

**Method 2: Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add ENCRYPTION_KEY production
```

### Environment Variable Security Checklist

- [ ] NEXTAUTH_SECRET is at least 32 characters
- [ ] ENCRYPTION_KEY is at least 32 characters
- [ ] DATABASE_URL uses SSL connection
- [ ] NEXTAUTH_URL uses https:// protocol
- [ ] No secrets committed to Git
- [ ] Production secrets different from development
- [ ] Secrets documented in secure password manager

---

## Vercel Deployment

### Initial Deployment

1. **Connect GitHub Repository**
   ```bash
   # Option A: Vercel Dashboard
   # 1. Go to https://vercel.com/new
   # 2. Import your GitHub repository
   # 3. Configure project settings
   # 4. Add environment variables
   # 5. Deploy
   
   # Option B: Vercel CLI
   vercel --prod
   ```

2. **Configure Build Settings** (if needed)
   
   Vercel automatically detects Next.js projects, but you can customize:
   
   ```json
   // vercel.json (optional)
   {
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "regions": ["iad1"]
   }
   ```

3. **Deploy**
   ```bash
   # Using Vercel CLI
   vercel --prod
   
   # Or push to main branch (if auto-deploy enabled)
   git push origin main
   ```

### Custom Domain Setup

1. **Add Domain to Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Configure DNS**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - HTTPS will be enabled within minutes

4. **Update NEXTAUTH_URL**
   ```bash
   # Update environment variable to your custom domain
   vercel env add NEXTAUTH_URL production
   # Enter: https://your-domain.com
   ```

### Deployment Verification

After deployment, verify:

- [ ] Application loads at production URL
- [ ] HTTPS is enabled (should redirect automatically)
- [ ] User registration works
- [ ] User login works
- [ ] Profile creation works
- [ ] API key management works
- [ ] Resume generation works
- [ ] PDF export works
- [ ] Cover letter generation works
- [ ] All pages render correctly
- [ ] No console errors in browser

---

## Post-Deployment Setup

### Database Initialization

1. **Run Migrations** (if not done already)
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

2. **Verify Database Schema**
   ```bash
   DATABASE_URL="your-production-url" npx prisma studio
   ```

3. **Create Test User** (optional)
   - Use the registration flow to create a test account
   - Test all features end-to-end

### Monitoring Setup

1. **Enable Vercel Analytics** (optional)
   ```bash
   npm install @vercel/analytics
   ```
   
   Add to `app/layout.tsx`:
   ```tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

2. **Vercel Speed Insights** (optional)
   ```bash
   npm install @vercel/speed-insights
   ```
   
   Add to `app/layout.tsx`:
   ```tsx
   import { SpeedInsights } from '@vercel/speed-insights/next';
   
   // Add <SpeedInsights /> to layout
   ```

3. **Error Tracking** (recommended)
   
   **Option A: Sentry**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
   
   **Option B: LogRocket**
   ```bash
   npm install logrocket
   ```

### Health Check Endpoint

Create `/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
```

Test: `curl https://your-domain.com/api/health`

---

## Monitoring & Logging

### Vercel Built-in Monitoring

**View Logs**:
```bash
# Real-time logs
vercel logs [deployment-url]

# Follow logs
vercel logs [deployment-url] --follow

# Filter by function
vercel logs [deployment-url] --since 1h
```

**Dashboard Metrics**:
- Go to Vercel Dashboard > your project
- View:
  - Request volume
  - Error rates
  - Response times
  - Build times
  - Bandwidth usage

### Application-Level Logging

Add structured logging:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  },
  warn: (message: string, meta?: object) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
  }
};
```

### Alerts Configuration

**Vercel Notifications**:
1. Go to Project Settings > Notifications
2. Configure alerts for:
   - Deployment failures
   - High error rates
   - Performance degradation

**Custom Alerts** (if using external monitoring):
- Set up alerts for:
  - API error rate > 5%
  - Response time > 3 seconds
  - Database connection failures
  - Disk space > 80%
  - Memory usage > 80%

---

## Backup & Recovery

### Database Backups

**Vercel Postgres**:
- Automatic daily backups (Pro plan)
- Point-in-time recovery available
- Backup retention: 7 days (configurable)

**Neon**:
- Automatic backups with project history
- Branch databases for testing
- Point-in-time restore

**Supabase**:
- Daily automated backups (Pro plan)
- Manual backups via dashboard
- Export database via pg_dump

### Manual Backup

```bash
# Export database
pg_dump DATABASE_URL > backup-$(date +%Y%m%d).sql

# Or using Prisma
npx prisma db pull
npx prisma generate
```

### Recovery Procedure

**From Vercel Postgres Backup**:
1. Go to Storage > your database
2. Click "Backups"
3. Select backup point
4. Click "Restore"

**From Manual Backup**:
```bash
# Restore from SQL dump
psql DATABASE_URL < backup-20251026.sql

# Or using Prisma
DATABASE_URL="your-url" npx prisma db push
```

### Disaster Recovery Plan

1. **Database Failure**:
   - Restore from latest backup
   - Verify data integrity
   - Run smoke tests

2. **Application Failure**:
   - Roll back to previous Vercel deployment
   - Check logs for root cause
   - Fix and redeploy

3. **Data Corruption**:
   - Restore from backup
   - Audit user data for consistency
   - Notify affected users if necessary

---

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

**Symptom**: "Can't reach database server"

**Solutions**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Check database is accessible
psql $DATABASE_URL -c "SELECT 1"

# Verify SSL mode
# For production databases, ensure ?sslmode=require

# Check connection pooling
# Use non-pooling URL for migrations
DATABASE_URL_NON_POOLING for npx prisma migrate deploy
```

**2. Authentication Issues**

**Symptom**: "Error in login", session not persisting

**Solutions**:
- Verify NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches production domain (https://)
- Check cookies are not blocked
- Ensure NEXTAUTH_URL has no trailing slash

**3. API Key Decryption Errors**

**Symptom**: "Decryption failed"

**Solutions**:
- Verify ENCRYPTION_KEY is set correctly
- Ensure ENCRYPTION_KEY is the same as when keys were encrypted
- **IMPORTANT**: If ENCRYPTION_KEY changed, users must re-add API keys

**4. Build Failures**

**Symptom**: Deployment fails during build

**Solutions**:
```bash
# Check build logs in Vercel dashboard
# Common issues:
- Missing environment variables
- TypeScript errors
- Missing dependencies

# Test build locally
npm run build

# Check environment variables are set
vercel env ls
```

**5. Performance Issues**

**Symptom**: Slow page loads, timeouts

**Solutions**:
- Check database query performance
- Review Vercel Analytics for slow endpoints
- Optimize database indexes (already done in Phase 8.3)
- Consider caching strategy
- Check serverless function timeouts (10s for Hobby, 60s for Pro)

### Health Check Procedure

Run these checks periodically:

```bash
# 1. Check application health
curl https://your-domain.com/api/health

# 2. Test authentication
# - Register new user
# - Login
# - Logout

# 3. Test resume generation
# - Create profile
# - Add API key
# - Generate resume
# - Export PDF

# 4. Check logs for errors
vercel logs --since 24h | grep -i error

# 5. Verify database connection
DATABASE_URL="your-url" npx prisma studio
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Security audit completed (Phase 8.11)
- [ ] All tests passing locally
- [ ] Build succeeds locally (`npm run build`)
- [ ] All features tested locally
- [ ] Database migrations ready
- [ ] Environment variables prepared
- [ ] Domain configured (if using custom domain)

### Deployment
- [ ] Production database created
- [ ] Database migrations run
- [ ] Environment variables configured in Vercel
- [ ] Application deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Post-Deployment
- [ ] Application accessible at production URL
- [ ] HTTPS working correctly
- [ ] User registration tested
- [ ] User login tested
- [ ] Profile creation tested
- [ ] API key management tested
- [ ] Resume generation tested
- [ ] PDF export tested
- [ ] Cover letter generation tested
- [ ] Health check endpoint working
- [ ] Monitoring configured
- [ ] Error tracking configured
- [ ] Backup strategy implemented

### Production Monitoring
- [ ] Vercel Analytics enabled (optional)
- [ ] Speed Insights enabled (optional)
- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Alert notifications configured
- [ ] Log monitoring set up
- [ ] Database backup verified
- [ ] Health checks scheduled

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error rates
- Check application health
- Review critical logs

**Weekly**:
- Review performance metrics
- Check disk usage
- Verify backups are running
- Update dependencies (minor versions)

**Monthly**:
- Security audit
- Update dependencies (major versions if safe)
- Review and rotate logs
- Test backup restoration
- Review and optimize database queries

**Quarterly**:
- Rotate ENCRYPTION_KEY (requires users to re-add API keys)
- Rotate NEXTAUTH_SECRET (requires users to re-login)
- Review and update security policies
- Capacity planning

---

## Support & Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

### Monitoring Tools
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [LogRocket](https://docs.logrocket.com/docs/getting-started-with-logrocket)

### Database Providers
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon](https://neon.tech/docs/introduction)
- [Supabase](https://supabase.com/docs)

---

## Conclusion

Your AI Resume Optimizer platform is now ready for production deployment. Follow this guide step-by-step to ensure a smooth deployment process.

**Need Help?**
- Check the [Troubleshooting](#troubleshooting) section
- Review application logs in Vercel dashboard
- Consult the [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for security considerations
- Review the main [README.md](./README.md) for application documentation

**Deployment Complete?**
- Test all features thoroughly
- Monitor for errors in the first 24 hours
- Set up automated monitoring and alerts
- Document any issues and resolutions

---

**Last Updated**: October 26, 2025  
**Maintained By**: Development Team  
**Version**: 1.0.0
