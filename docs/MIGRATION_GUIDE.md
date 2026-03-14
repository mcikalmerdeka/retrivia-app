# Migrating from Supabase to Neon

This guide explains how to migrate your Retrivia app from Supabase to Neon database.

## Why Neon?

Neon is a serverless Postgres database that doesn't have the 90-day idle pause limitation like Supabase's free tier. Your database will remain accessible indefinitely.

## What Changed?

### Database
- **Before**: Supabase (PostgreSQL + Auth + Storage)
- **After**: Neon (PostgreSQL only)

### Authentication
- **Before**: Supabase Auth with Google OAuth
- **After**: Authentication removed (app now works without login)
  - If you need auth later, consider implementing NextAuth.js or Clerk

### File Storage
- **Before**: Supabase Storage for images
- **After**: Base64 images stored directly (temporary solution)
  - **Recommendation**: For production, use Cloudinary, AWS S3, or Vercel Blob

## Setup Instructions

### 1. Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host/database`)

### 2. Set Up the Database Schema

1. In your Neon dashboard, go to the SQL Editor
2. Run the SQL from `docs/NEON_SETUP.sql`:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_urls TEXT,
  photostrip_url TEXT,
  captions TEXT,
  memory_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
```

### 3. Configure Environment Variables

Update your `.env.local` file:

```bash
# Remove these Supabase variables:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Add this Neon variable:
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Test the Connection

Start the development server and visit:
- `http://localhost:3000/api/test-db` - Should return connection success

## Important Notes

### Images Storage
Currently, images are stored as base64 strings directly in the database. This works for small applications but is not recommended for production because:
- Database size grows quickly
- Base64 encoding increases file size by ~33%
- No CDN benefits

**Recommended solutions for production:**
1. **Cloudinary** - Easy to use, generous free tier
2. **AWS S3** - Industry standard, requires more setup
3. **Vercel Blob** - Good for Vercel deployments

### Authentication
The app now works without authentication. All users share the same photobook. If you need user accounts:

**Option 1: NextAuth.js**
```bash
npm install next-auth
```
Follow [NextAuth.js documentation](https://next-auth.js.org/)

**Option 2: Clerk**
```bash
npm install @clerk/nextjs
```
Follow [Clerk documentation](https://clerk.com/docs)

### Database Schema

The sessions table stores:
- `id`: Unique identifier
- `created_at`: Timestamp
- `photo_urls`: JSON array of base64 image strings
- `photostrip_url`: Base64 string of the final photostrip
- `captions`: User's caption text
- `memory_notes`: User's memory notes

## Troubleshooting

### Connection Errors
- Verify your `DATABASE_URL` is correct
- Ensure SSL mode is enabled (`?sslmode=require`)
- Check that the database is active in Neon dashboard

### Images Not Loading
- Check browser console for errors
- Verify the database has data: `SELECT COUNT(*) FROM sessions;`
- Clear browser cache and localStorage

### Large Database Size
If your database grows too large from storing base64 images:
1. Consider implementing Cloudinary for image storage
2. Add a cleanup job to delete old sessions
3. Upgrade your Neon plan

## Rollback to Supabase

If you need to rollback:
1. Restore your Supabase project (if within 90 days)
2. Revert the `src/lib/supabase.ts` file from git
3. Update environment variables back to Supabase

## Support

For Neon-specific issues:
- [Neon Documentation](https://neon.tech/docs/)
- [Neon Discord](https://discord.gg/YX3YnPp4qF)

For Retrivia app issues:
- Check the console logs
- Verify all API routes return 200 status
- Test database connection at `/api/test-db`
