# Supabase Setup Guide for Photobooth Web App

This guide will walk you through setting up Supabase for the storage of images for the Photobooth Web App.

## 1. Create a Supabase Account

1. Go to [Supabase](https://supabase.com/) and sign up for a free account if you don't have one already.
2. After signing up, you'll be redirected to the dashboard.

## 2. Create a New Project

1. From the Supabase dashboard, click on "New Project".
2. Enter a name for your project (e.g., "Photobooth App").
3. Set a secure database password (make sure to remember it).
4. Choose a region that's closest to your target users.
5. Click "Create new project".
6. Wait for your project to be created (this may take a few minutes).

## 3. Get Your API Keys

1. After your project is created, navigate to the project dashboard.
2. In the left sidebar, click on "Project Settings" (the gear icon).
3. Click on "API" in the submenu.
4. You'll see two keys: `anon public` and `service_role`. For this application, you need the `anon public` key.
5. Copy the "URL" and "anon public" key values.

## 4. Update Environment Variables

1. In your project's `.env` file, update the following values:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. Replace `your-supabase-project-url` with the URL you copied.
3. Replace `your-supabase-anon-key` with the "anon public" key you copied.

## 5. Set Up Storage Buckets

1. In the Supabase dashboard, click on "Storage" in the left sidebar.
2. Click "Create a new bucket".
3. Enter "photostrips" as the bucket name.
4. Set the bucket privacy to "Public" (since we want to be able to share photostrip URLs).
5. Click "Create bucket".

## 6. Set Up Database Tables

1. In the Supabase dashboard, click on "Table Editor" in the left sidebar.
2. Click "Create a new table".
3. Set the following table details:
   - Name: "sessions"
   - Enable Row Level Security (RLS): Yes (checked)
   - Columns:
     - id (type: uuid, primary key, default: gen_random_uuid())
     - created_at (type: timestamptz, default: now())
     - photo_urls (type: text, nullable: true)
     - photostrip_url (type: text, nullable: true)
     - captions (type: text, nullable: true)
4. Click "Save" to create the table.

## 7. Set Up Database RLS Policy (CRITICAL)

1. After creating the table, click on "Authentication" in the left sidebar.
2. Click on "Policies".
3. Find the "sessions" table and click "New Policy".
4. Choose "Create a policy from scratch".
5. For "Policy name", enter "Allow public insert access".
6. For policy definition, select:
   - For Operation: "INSERT"
   - Target roles: Leave blank for public access
   - Using expression: `true`
   - With check expression: `true`
7. Click "Save" to create the policy.
8. Repeat to create another policy:
   - Policy name: "Allow public select access"
   - Operation: "SELECT"
   - Target roles: Leave blank
   - Using expression: `true`
9. Save this policy as well.

> **Important**: Without these RLS policies, database operations will silently fail. Row Level Security is enabled by default in Supabase and requires explicit policies to allow operations.

### Alternative: Set up RLS Policies Using SQL

If the UI method doesn't work, you can also set up the policies using SQL. Go to the SQL Editor in your Supabase dashboard and run:

```sql
-- Enable RLS on the sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT access
CREATE POLICY "Allow public insert access"
ON sessions
FOR INSERT
TO public
USING (true)
WITH CHECK (true);

-- Allow public SELECT access
CREATE POLICY "Allow public select access"
ON sessions
FOR SELECT
TO public
USING (true);

-- Allow public UPDATE access
CREATE POLICY "Allow public update access"
ON sessions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow public DELETE access
CREATE POLICY "Allow public delete access"
ON sessions
FOR DELETE
TO public
USING (true);
```

You can run each statement separately if needed.

## 8. Set Up Storage Policies

1. Navigate back to "Storage" in the left sidebar.
2. Click on the "photostrips" bucket.
3. Click on the "Policies" tab.
4. Click "Create Policy".
5. Choose "Create a policy from scratch".
6. Policy name: "Public Access Policy"
7. For "Allow these operations": Check all options (SELECT, INSERT, UPDATE, DELETE)
8. For "Policy definition": `true` (this allows public access - for a production app, you might want to restrict this further)
9. Click "Save" to create the policy.

## 9. Testing Your Setup

1. After completing these steps, restart your development server.
2. Try taking photos or uploading photos to the app.
3. Check if the images appear in your Supabase storage bucket.
4. If everything works correctly, you should be able to see the uploaded images in the Supabase dashboard under Storage > photostrips.

## 10. Next Steps for Production

For a production environment, you should consider:

1. Setting up more restrictive access policies for storage.
2. Implementing user authentication to associate photos with specific users.
3. Setting up rate limiting to prevent abuse.
4. Consider using Supabase Edge Functions for more complex server-side operations.

## Troubleshooting

If you encounter issues:

1. Check the browser console for any error messages.
2. Verify that your environment variables are correctly set.
3. Make sure your browser allows accessing the camera (for the photobooth feature).
4. Ensure your Supabase bucket policies are correctly configured.
