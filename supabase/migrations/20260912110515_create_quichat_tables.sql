/*
# QuiChat: Create profiles and messages tables with RLS

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `username` (text, unique) — display name chosen at registration
  - `avatar_initials` (text, default 'ME') — 2-letter initials for avatar bubble
  - `status_message` (text, default 'Available') — status/bio line
  - `online_status` (text, default 'offline') — 'online' | 'away' | 'offline'
  - `is_typing` (boolean, default false) — typing indicator flag
  - `created_at` (timestamptz, default now())

- `messages`
  - `id` (uuid, primary key)
  - `sender_id` (uuid, not null, references auth.users) — who sent it
  - `receiver_id` (uuid, not null, references auth.users) — who receives it
  - `content` (text, not null) — message text
  - `status` (text, default 'sent') — 'sent' | 'delivered' | 'read'
  - `created_at` (timestamptz, default now()) — used for ordering and display

2. Security
- Enable RLS on both tables.
- `profiles`: authenticated users can SELECT all profiles (needed to show other users in chat list),
  but can only INSERT/UPDATE their own profile row.
- `messages`: authenticated users can SELECT messages where they are sender or receiver,
  can INSERT only messages where sender_id = auth.uid(),
  can UPDATE only messages they sent (e.g. for read receipts),
  can DELETE only messages they sent.

3. Indexes
- `messages(sender_id)` and `messages(receiver_id)` for conversation queries.
- `messages(created_at)` for ordering.

4. Realtime
- Add messages table to Supabase Realtime publication for INSERT events.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_initials text NOT NULL DEFAULT 'ME',
  status_message text NOT NULL DEFAULT 'Available',
  online_status text NOT NULL DEFAULT 'offline',
  is_typing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone authenticated can see all profiles (chat list needs it)
DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles"
  ON profiles FOR SELECT
  TO authenticated USING (true);

-- Profiles: users can insert only their own profile
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Profiles: users can update only their own profile
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Profiles: users can delete only their own profile
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
  ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages: users can see messages they sent or received
DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages"
  ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Messages: users can insert only messages they send
DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages"
  ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Messages: users can update only messages they sent
DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages"
  ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- Messages: users can delete only messages they sent
DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages"
  ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- Indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
