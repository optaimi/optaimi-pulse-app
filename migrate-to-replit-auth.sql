-- Migration script for Replit Auth
-- This will drop existing tables and recreate them with varchar user IDs

-- Drop old tables (in correct order to respect foreign keys)
DROP TABLE IF EXISTS email_events CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now run: npm run db:push to create new Replit Auth tables
