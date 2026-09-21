-- Privacy graph: contact requests, blocks, mutes, last-seen visibility.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_visibility text NOT NULL DEFAULT 'everyone';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_last_seen_visibility_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_last_seen_visibility_check
  CHECK (last_seen_visibility IN ('everyone', 'contacts', 'nobody'));

CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT contact_requests_not_self CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS contact_requests_pair_idx
  ON contact_requests (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_contact_requests" ON contact_requests;
CREATE POLICY "select_own_contact_requests"
  ON contact_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "insert_own_contact_requests" ON contact_requests;
CREATE POLICY "insert_own_contact_requests"
  ON contact_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "update_own_contact_requests" ON contact_requests;
CREATE POLICY "update_own_contact_requests"
  ON contact_requests FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "delete_own_contact_requests" ON contact_requests;
CREATE POLICY "delete_own_contact_requests"
  ON contact_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_not_self CHECK (blocker_id <> blocked_id)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_related_blocks" ON blocks;
CREATE POLICY "select_related_blocks"
  ON blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "insert_own_blocks" ON blocks;
CREATE POLICY "insert_own_blocks"
  ON blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "delete_own_blocks" ON blocks;
CREATE POLICY "delete_own_blocks"
  ON blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS conversation_mutes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, peer_id)
);

ALTER TABLE conversation_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mutes" ON conversation_mutes;
CREATE POLICY "select_own_mutes"
  ON conversation_mutes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mutes" ON conversation_mutes;
CREATE POLICY "insert_own_mutes"
  ON conversation_mutes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mutes" ON conversation_mutes;
CREATE POLICY "delete_own_mutes"
  ON conversation_mutes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.can_message(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = target
      OR (
        NOT EXISTS (
          SELECT 1 FROM public.blocks
          WHERE (blocker_id = auth.uid() AND blocked_id = target)
             OR (blocker_id = target AND blocked_id = auth.uid())
        )
        AND EXISTS (
          SELECT 1 FROM public.contact_requests
          WHERE status = 'accepted'
            AND (
              (requester_id = auth.uid() AND addressee_id = target)
              OR (requester_id = target AND addressee_id = auth.uid())
            )
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_message(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_message(uuid) TO authenticated;

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.can_message(receiver_id));

INSERT INTO contact_requests (requester_id, addressee_id, status, responded_at)
SELECT DISTINCT
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  'accepted',
  now()
FROM messages
WHERE sender_id <> receiver_id
  AND NOT EXISTS (
    SELECT 1
    FROM contact_requests cr
    WHERE LEAST(cr.requester_id, cr.addressee_id) = LEAST(messages.sender_id, messages.receiver_id)
      AND GREATEST(cr.requester_id, cr.addressee_id) = GREATEST(messages.sender_id, messages.receiver_id)
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'contact_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contact_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'blocks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
  END IF;
END $$;
