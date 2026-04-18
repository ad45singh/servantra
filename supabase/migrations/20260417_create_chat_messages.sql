-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    message_type text DEFAULT 'text',
    metadata jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their booking messages" ON public.chat_messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = chat_messages.booking_id
            AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages to their bookings" ON public.chat_messages
    FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = chat_messages.booking_id
            AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages or mark as read" ON public.chat_messages
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = chat_messages.booking_id
            AND (bookings.customer_id = auth.uid() OR bookings.vendor_id = auth.uid())
        )
    );

-- Enable Realtime
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;
