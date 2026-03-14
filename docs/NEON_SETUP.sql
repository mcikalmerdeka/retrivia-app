-- Neon Database Setup for Retrivia
-- Run this SQL in your Neon SQL Editor to set up the database

-- Create the sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_urls TEXT,
  photostrip_url TEXT,
  captions TEXT,
  memory_notes TEXT
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- Optional: Enable Row Level Security if you implement authentication later
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
