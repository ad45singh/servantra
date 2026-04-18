-- Service catalog table for admin-managed services
CREATE TABLE public.service_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  duration text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can view active entries
CREATE POLICY "Active services viewable by everyone"
ON public.service_catalog
FOR SELECT
USING (active = true);

-- Admins can view all (incl. inactive)
CREATE POLICY "Admins can view all services"
ON public.service_catalog
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert services"
ON public.service_catalog
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update services"
ON public.service_catalog
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete services"
ON public.service_catalog
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_service_catalog_updated_at
BEFORE UPDATE ON public.service_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_service_catalog_category ON public.service_catalog(category);
CREATE INDEX idx_service_catalog_active ON public.service_catalog(active);