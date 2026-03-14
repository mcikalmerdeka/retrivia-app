# Supabase Database Connection Troubleshooting

If you're experiencing issues with saving data to your Supabase database despite successfully uploading images to Storage, follow these steps to diagnose and fix the problem.

## Use the Built-in Test Page

We've added a diagnostic page that helps identify specific issues with your Supabase setup:

1. Start your development server with `npm run dev`
2. Navigate to [http://localhost:3000/supabase-test](http://localhost:3000/supabase-test)
3. Use the "Run Connection Test" button to test basic connectivity
4. Try the "Manual Insert" button to attempt a direct database insertion
5. Check the browser console (F12) for detailed error messages

This test page will provide more specific information about what's failing in your Supabase connection.

## Test Direct Database Access

1. Go to your Supabase dashboard
2. Click on the "SQL Editor" in the left sidebar
3. Try running a simple INSERT query:

```sql
INSERT INTO sessions (created_at, photo_urls, photostrip_url, captions)
VALUES (
  NOW(),
  '["https://example.com/test1.jpg"]',
  'https://example.com/test-photostrip.jpg',
  'Test caption'
);
```

4. If this works, you know the database is functioning correctly but there's an issue with the client-side permissions or API connection.

## Verify Your Environment Variables

Make sure your `.env` file has the correct Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your-actual-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

You can verify these values in your Supabase dashboard under Project Settings > API.

## Common RLS Policy Issues

The most common issue is with Row Level Security (RLS) policies. Run this SQL in the Supabase SQL Editor to check your policies:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sessions';
```

If you don't see any policies or they're not correctly set up, run these SQL commands:

```sql
-- Enable RLS on the sessions table (it should already be enabled)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create a simple public INSERT policy
CREATE POLICY "public_insert_sessions" 
ON sessions 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Create a simple public SELECT policy
CREATE POLICY "public_select_sessions" 
ON sessions 
FOR SELECT 
TO public 
USING (true);
```

## Check for Schema Issues

Verify your sessions table has the correct structure:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions';
```

Make sure your table has these columns:
- id (uuid)
- created_at (timestamptz)
- photo_urls (text)
- photostrip_url (text)
- captions (text)

## Try a Simplified Table Structure

If nothing else works, try creating a basic test table:

```sql
-- Create a simpler test table
CREATE TABLE test_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  content text
);

-- Enable RLS
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "public_insert_test" ON test_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_select_test" ON test_sessions FOR SELECT USING (true);
```

Then try inserting into this test table to see if the issue is with the table structure or permissions.

## Other Troubleshooting Steps

1. **Check Network Traffic**: Use your browser's Network tab (F12) to see the actual API requests and responses
2. **Try in Incognito Mode**: Test in a private/incognito browser window to rule out browser extension issues
3. **Clear Browser Cache**: Clear site data and reload the application
4. **Update Supabase Client**: Make sure you're using the latest version of the Supabase JS client

Remember that images are still being saved to Storage even if database entries fail, so your core functionality is working! 