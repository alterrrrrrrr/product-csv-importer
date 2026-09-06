
DROP TABLE IF EXISTS public.categories CASCADE;

DROP TABLE IF EXISTS public.agents CASCADE;

DROP TABLE IF EXISTS public.products CASCADE;

DROP TABLE IF EXISTS public.guide_steps CASCADE;

DROP TABLE IF EXISTS public.settings CASCADE;



CREATE TABLE public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories public write" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  referral_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO anon, authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents public read" ON public.agents FOR SELECT USING (true);
CREATE POLICY "agents public write" ON public.agents FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '',
  price numeric not null default 0,
  image_url text,
  qc_url text,
  quality text not null default 'Best',
  likes int not null default 0,
  dislikes int not null default 0,
  views int not null default 0,
  agent_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products public write" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.guide_steps (
  id uuid primary key default gen_random_uuid(),
  step_number int not null default 1,
  title text not null,
  description text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guide_steps TO anon, authenticated;
GRANT ALL ON public.guide_steps TO service_role;
ALTER TABLE public.guide_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guide public read" ON public.guide_steps FOR SELECT USING (true);
CREATE POLICY "guide public write" ON public.guide_steps FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.settings (
  key text primary key,
  value text not null default ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings public write" ON public.settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.categories (name, slug, sort_order) VALUES
 ('Buty','buty',1),('Spodnie','spodnie',2),('Kurtki','kurtki',3),('Koszulki','koszulki',4),('Bluzy','bluzy',5),('Akcesoria','akcesoria',6),('Zegarki','zegarki',7);

INSERT INTO public.agents (name, avatar_url, referral_url, sort_order) VALUES
 ('Litbuy','https://ui-avatars.com/api/?name=L&background=0d9488&color=fff','https://litbuy.com/register?ref=PKMR',1),
 ('Kakaobuy','https://ui-avatars.com/api/?name=K&background=06b6d4&color=fff','https://kakobuy.com/register?ref=PKMR',2),
 ('USFans','https://ui-avatars.com/api/?name=U&background=00f2fe&color=001&','https://usfans.com/register?ref=PKMR',3);

INSERT INTO public.settings (key, value) VALUES
 ('agent_logo_url','https://ui-avatars.com/api/?name=PKMR&background=0b0f19&color=00f2fe&size=256'),
 ('primary_agent_url','https://litbuy.com/register?ref=PKMR'),
 ('promo_banner_url',''),
 ('promo_code','PKMR'),
 ('tiktok_url','https://tiktok.com'),
 ('discord_url','https://discord.com'),
 ('telegram_url','https://telegram.org'),
 ('whatsapp_url','https://whatsapp.com'),
 ('instagram_url','https://instagram.com');

INSERT INTO public.guide_steps (step_number, title, description, image_url) VALUES
 (1,'Załóż konto u agenta','Kliknij w link rejestracyjny, załóż konto i odbierz kupony powitalne.',null),
 (2,'Skopiuj link produktu','Skopiuj link z naszej strony lub z TikToka i wklej go w wyszukiwarkę agenta.',null),
 (3,'Zamów i sprawdź QC','Opłać zamówienie, poczekaj na zdjęcia QC i zaakceptuj jakość.',null),
 (4,'Wyślij paczkę','Wybierz metodę wysyłki, opłać shipping i czekaj na paczkę.',null);


ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];
INSERT INTO public.settings (key, value) VALUES
  ('admin_username', 'replikaenjoyeradmin'),
  ('admin_password_hash', 'a8bf5c33c4cee8bd6e5b31b0e2ee69ba98a5a9be0da95c07c1a3ef67a4f7edc0')
ON CONFLICT (key) DO NOTHING;


CREATE TABLE public.sellers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL DEFAULT '',
  logo_url text,
  banner_url text,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers public read" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "sellers public write" ON public.sellers FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS batch text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS price_cny numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promoted boolean NOT NULL DEFAULT false;

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS external_url text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  link_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promos TO anon, authenticated;
GRANT ALL ON public.promos TO service_role;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos public read" ON public.promos FOR SELECT USING (true);
CREATE POLICY "promos public write" ON public.promos FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO anon, authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social public read" ON public.social_links FOR SELECT USING (true);
CREATE POLICY "social public write" ON public.social_links FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  line_name text NOT NULL DEFAULT 'Standard',
  base_price numeric NOT NULL DEFAULT 0,
  price_per_kg numeric NOT NULL DEFAULT 0,
  min_weight numeric NOT NULL DEFAULT 0,
  max_weight numeric NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_rates TO anon, authenticated;
GRANT ALL ON public.shipping_rates TO service_role;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipping public read" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "shipping public write" ON public.shipping_rates FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.social_links (label, url, icon, sort_order)
SELECT 'TikTok', '', 'TT', 1
WHERE NOT EXISTS (SELECT 1 FROM public.social_links);
INSERT INTO public.social_links (label, url, icon, sort_order)
SELECT 'Discord', '', 'DC', 2
WHERE NOT EXISTS (SELECT 1 FROM public.social_links WHERE label = 'Discord');

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_url text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_name text NOT NULL DEFAULT '';
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.shipping_rates ADD COLUMN IF NOT EXISTS price_table jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS link_mode text NOT NULL DEFAULT 'agents';


REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT SELECT (id, name, slug, username, logo_url, banner_url, description, active, created_at, updated_at, external_url, link_mode)
  ON public.sellers TO anon, authenticated;
GRANT ALL ON public.sellers TO service_role;



insert into public.categories (name, slug, sort_order)
select distinct p.category,
       lower(regexp_replace(regexp_replace(trim(p.category), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
       100
from public.products p
where trim(p.category) <> ''
  and p.category not in (select name from public.categories);


ALTER TABLE public.shipping_rates
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text NOT NULL DEFAULT '';


ALTER TABLE public.products ADD COLUMN IF NOT EXISTS for_women boolean NOT NULL DEFAULT false;


REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT SELECT (id, name, slug, username, logo_url, banner_url, description, active, created_at, updated_at, external_url, link_mode)
  ON public.sellers TO anon, authenticated;
GRANT ALL ON public.sellers TO service_role;



DROP POLICY IF EXISTS "agents public write" ON public.agents;
DROP POLICY IF EXISTS "categories public write" ON public.categories;
DROP POLICY IF EXISTS "guide public write" ON public.guide_steps;
DROP POLICY IF EXISTS "products public write" ON public.products;
DROP POLICY IF EXISTS "promos public write" ON public.promos;
DROP POLICY IF EXISTS "sellers public write" ON public.sellers;
DROP POLICY IF EXISTS "settings public write" ON public.settings;
DROP POLICY IF EXISTS "shipping public write" ON public.shipping_rates;
DROP POLICY IF EXISTS "social public write" ON public.social_links;

REVOKE INSERT, UPDATE, DELETE ON public.agents FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.categories FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.guide_steps FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.promos FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sellers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.settings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.shipping_rates FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.social_links FROM anon, authenticated;

GRANT ALL ON public.agents TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.guide_steps TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.promos TO service_role;
GRANT ALL ON public.sellers TO service_role;
GRANT ALL ON public.settings TO service_role;
GRANT ALL ON public.shipping_rates TO service_role;
GRANT ALL ON public.social_links TO service_role;

REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT SELECT (id, name, slug, logo_url, banner_url, description, active, external_url, link_mode, created_at, updated_at)
  ON public.sellers TO anon, authenticated;



REVOKE ALL ON public.sellers FROM anon, authenticated;

GRANT SELECT (id, name, slug, logo_url, banner_url, description, active, created_at, updated_at, external_url, link_mode)
  ON public.sellers TO anon, authenticated;

GRANT ALL ON public.sellers TO service_role;

DROP POLICY IF EXISTS "sellers public read" ON public.sellers;
CREATE POLICY "sellers public read" ON public.sellers FOR SELECT TO anon, authenticated USING (true);


ALTER TABLE public.products ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.shipping_rates ADD COLUMN IF NOT EXISTS signup_url text NOT NULL DEFAULT ''::text;


ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT false;
ALTER TABLE public.products DROP COLUMN IF EXISTS likes;
ALTER TABLE public.products DROP COLUMN IF EXISTS dislikes;


REVOKE ALL ON public.shipping_rates FROM anon, authenticated;
GRANT SELECT (id, agent_name, line_name, base_price, price_per_kg, min_weight, max_weight, sort_order, created_at, price_table, signup_url) ON public.shipping_rates TO anon, authenticated;
GRANT ALL ON public.shipping_rates TO service_role;



DROP POLICY IF EXISTS "sellers public read" ON public.sellers;
REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT ALL ON public.sellers TO service_role;

CREATE OR REPLACE VIEW public.sellers_public
WITH (security_invoker = off) AS
SELECT id, name, slug, logo_url, banner_url, description, active, external_url, link_mode, created_at
FROM public.sellers;

GRANT SELECT ON public.sellers_public TO anon, authenticated;


CREATE POLICY "sellers public read" ON public.sellers FOR SELECT TO anon, authenticated USING (true);


CREATE OR REPLACE VIEW public.sellers_public
WITH (security_invoker = on) AS
SELECT id, name, slug, logo_url, banner_url, description, active, external_url, link_mode, created_at
FROM public.sellers;

GRANT SELECT ON public.sellers_public TO anon, authenticated;
