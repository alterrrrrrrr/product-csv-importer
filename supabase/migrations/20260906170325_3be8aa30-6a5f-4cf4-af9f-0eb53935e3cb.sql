-- Sellers: hide password_hash from public Data API reads (column-level grants).
REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT SELECT (id, name, slug, logo_url, banner_url, description, active, created_at, updated_at, external_url, link_mode)
  ON public.sellers TO anon, authenticated;
GRANT ALL ON public.sellers TO service_role;