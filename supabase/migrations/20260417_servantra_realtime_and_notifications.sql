-- ============================================================
-- SERVANTRA — New Tables & Policies for Recent Features
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable Realtime for all key tables (required for real-time sync)
-- Run these in Supabase Dashboard → Database → Replication → Add tables
-- OR run via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- ============================================================
-- 2. vendor_services — Admin read access (needed for RecommendedVendors)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vendor_services' AND policyname = 'Admins can view all vendor services'
  ) THEN
    CREATE POLICY "Admins can view all vendor services"
    ON public.vendor_services FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Vendors can read their own services (may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vendor_services' AND policyname = 'Vendors can view own services'
  ) THEN
    CREATE POLICY "Vendors can view own services"
    ON public.vendor_services FOR SELECT TO authenticated
    USING (vendor_id = auth.uid());
  END IF;
END $$;

-- Customers can view active vendor services (for RecommendedVendors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vendor_services' AND policyname = 'Customers can view active vendor services'
  ) THEN
    CREATE POLICY "Customers can view active vendor services"
    ON public.vendor_services FOR SELECT TO authenticated
    USING (active = true);
  END IF;
END $$;

-- Vendors can insert their own services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vendor_services' AND policyname = 'Vendors can insert own services'
  ) THEN
    CREATE POLICY "Vendors can insert own services"
    ON public.vendor_services FOR INSERT TO authenticated
    WITH CHECK (vendor_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 3. notifications — Vendors can receive notifications
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'System can insert notifications'
  ) THEN
    CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 4. Auto-create notification when a new booking is placed
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS trigger AS $$
BEGIN
  -- Notify the customer
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.customer_id,
    'booking',
    'Booking Placed!',
    'Your booking for ' || NEW.service_type || ' on ' || NEW.scheduled_date || ' has been received.'
  );

  -- Notify the vendor (if assigned)
  IF NEW.vendor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.vendor_id,
      'booking',
      'New Booking Request',
      'You have a new ' || NEW.service_type || ' booking on ' || NEW.scheduled_date || '.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists, then recreate
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();

-- ============================================================
-- 5. Auto-create notification when booking status changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the customer
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.customer_id,
      'booking',
      'Booking ' || initcap(NEW.status),
      'Your ' || NEW.service_type || ' booking has been ' || NEW.status || '.'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_status_changed ON public.bookings;
CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_status_change();

-- ============================================================
-- 6. Auto-create admin notification when new vendor registers
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_vendor()
RETURNS trigger AS $$
DECLARE
  admin_ids uuid[];
  admin_id uuid;
  vendor_name text;
BEGIN
  IF NEW.role = 'vendor' THEN
    -- Get vendor name
    SELECT full_name INTO vendor_name FROM public.profiles WHERE user_id = NEW.user_id;

    -- Get all admin user IDs
    SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';

    IF admin_ids IS NOT NULL THEN
      FOREACH admin_id IN ARRAY admin_ids LOOP
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (
          admin_id,
          'user',
          'New Vendor Registered',
          COALESCE(vendor_name, 'A new vendor') || ' has joined the platform as a service provider.'
        );
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vendor_registered ON public.user_roles;
CREATE TRIGGER on_vendor_registered
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_vendor();

-- ============================================================
-- Done! Your Supabase backend is now fully configured.
-- ============================================================
