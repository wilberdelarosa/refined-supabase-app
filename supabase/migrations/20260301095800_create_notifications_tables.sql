-- Migration to create the notifications table and related policies

CREATE TYPE notification_type AS ENUM ('ORDER_UPDATE', 'PROMO', 'SYSTEM_ALERT', 'NEW_ORDER', 'NEW_USER');

CREATE TYPE notification_priority AS ENUM ('LOW', 'NORMAL', 'HIGH');

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE, -- If null, it's a global notification (e.g., for all admins)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'SYSTEM_ALERT',
    priority notification_priority NOT NULL DEFAULT 'NORMAL',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can read their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (auth.uid () = user_id);

-- System can read notifications without user_id (global/admin notifications) for admins
CREATE POLICY "Admins can view global notifications" ON public.notifications FOR
SELECT USING (
        user_id IS NULL
        AND EXISTS (
            SELECT 1
            FROM user_roles
            WHERE
                user_id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR
UPDATE USING (auth.uid () = user_id);

-- Admins can create notifications
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM user_roles
            WHERE
                user_id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Trigger to notify on insert via realtime if needed (Supabase realtime handles this automatically if publication is enabled)
-- Ensure the table is added to the realtime publication
BEGIN;

DROP PUBLICATION IF EXISTS supabase_realtime;

CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

COMMIT;
-- Note: Often in Supabase, you want to selectively add tables. If supabase_realtime already exists, we alter it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- We'll assume the user has a way to manage publications via dashboard or we just add it to the logical replication.

DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE
        pubname = 'supabase_realtime'
        AND tablename = 'notifications'
) THEN
EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';

EXCEPTION WHEN OTHERS THEN
-- Ignore if publication doesn't exist or table already added
END;

END $$;