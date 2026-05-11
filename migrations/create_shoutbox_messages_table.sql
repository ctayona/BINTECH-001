-- ============================================
-- SHOUTBOX MESSAGES TABLE
-- Community Forum / Live Chat System
-- ============================================

-- Create shoutbox_messages table
CREATE TABLE IF NOT EXISTS public.shoutbox_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.user_accounts(system_id) ON DELETE CASCADE,
    message_text VARCHAR(250) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shoutbox_sender ON public.shoutbox_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_shoutbox_created_at ON public.shoutbox_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shoutbox_not_deleted ON public.shoutbox_messages(is_deleted) WHERE is_deleted = FALSE;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_shoutbox_updated_at ON public.shoutbox_messages;
CREATE TRIGGER trg_shoutbox_updated_at
    BEFORE UPDATE ON public.shoutbox_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add comment to table
COMMENT ON TABLE public.shoutbox_messages IS 'Community shoutbox messages for live chat on Rewards page';
COMMENT ON COLUMN public.shoutbox_messages.message_id IS 'Unique message identifier';
COMMENT ON COLUMN public.shoutbox_messages.sender_id IS 'References user_accounts.system_id';
COMMENT ON COLUMN public.shoutbox_messages.message_text IS 'Message content (max 250 characters)';
COMMENT ON COLUMN public.shoutbox_messages.is_deleted IS 'Soft delete flag for moderation';
COMMENT ON COLUMN public.shoutbox_messages.is_edited IS 'Indicates if message was edited';
