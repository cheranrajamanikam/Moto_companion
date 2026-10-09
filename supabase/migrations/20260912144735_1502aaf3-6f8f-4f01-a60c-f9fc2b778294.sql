-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- emergency contacts
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  phone_number text NOT NULL,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders manage own contacts" ON public.emergency_contacts FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- sos alerts
CREATE TABLE public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders manage own alerts" ON public.sos_alerts FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_sos_alerts_updated_at BEFORE UPDATE ON public.sos_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- community posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Riders create own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Riders update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Riders delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT SELECT ON public.post_likes TO anon;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Riders like as themselves" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Riders remove own likes" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Riders create own comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Riders update own comments" ON public.post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Riders delete own comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz NOT NULL,
  image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Riders create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators update own events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators delete own events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_participants TO authenticated;
GRANT SELECT ON public.event_participants TO anon;
GRANT ALL ON public.event_participants TO service_role;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants are viewable by everyone" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Riders join as themselves" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Riders leave own events" ON public.event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- leaderboard
CREATE TABLE public.leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rider_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  safe_rides integer NOT NULL DEFAULT 0,
  week text NOT NULL,
  challenge_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard_entries TO authenticated;
GRANT SELECT ON public.leaderboard_entries TO anon;
GRANT ALL ON public.leaderboard_entries TO service_role;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is viewable by everyone" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Riders insert own scores" ON public.leaderboard_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Riders update own scores" ON public.leaderboard_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Riders delete own scores" ON public.leaderboard_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON public.leaderboard_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- shop
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price_inr numeric(10,2) NOT NULL,
  description text,
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders manage own cart" ON public.cart_items FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- gear preferences
CREATE TABLE public.gear_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_type text NOT NULL,
  riding_type text NOT NULL,
  experience_level text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_preferences TO authenticated;
GRANT ALL ON public.gear_preferences TO service_role;
ALTER TABLE public.gear_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders manage own gear preferences" ON public.gear_preferences FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_gear_preferences_updated_at BEFORE UPDATE ON public.gear_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed products
INSERT INTO public.products (name, category, price_inr, description, image_url, in_stock) VALUES
('Vega Bolt Full-Face Helmet', 'Helmet', 4299.00, 'ISI-certified full-face helmet with anti-scratch visor and quick-release strap.', 'https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?w=800&q=80', true),
('SMK Typhoon Dual-Visor Helmet', 'Helmet', 6999.00, 'Dual visor with internal sun shade, pinlock-ready, ideal for highway touring.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80', true),
('Rynox Air GT 3 Riding Jacket', 'Jacket', 9450.00, 'Mesh touring jacket with CE Level 2 armour and all-weather liner.', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800&q=80', true),
('Solace Coolpro Summer Jacket', 'Jacket', 7200.00, 'High-airflow summer jacket built for Indian city heat.', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80', true),
('Axor Ninja Riding Gloves', 'Gloves', 1999.00, 'Knuckle-protected gloves with touchscreen-friendly fingertips.', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', true),
('Rynox Storm Evo 3 Gloves', 'Gloves', 3450.00, 'Waterproof monsoon gloves with visor wiper and TPU knuckle.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80', true),
('Leatt Airflex Knee Guards', 'Knee Guards', 3899.00, 'Slim, breathable CE-certified knee armour for daily riding.', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80', true),
('BBG Knee & Shin Guards', 'Knee Guards', 1650.00, 'Hard-shell knee and shin protection with adjustable straps.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', true),
('Steelbird Ranger Riding Boots', 'Boots', 5499.00, 'Ankle-support touring boots with anti-slip sole and waterproof shell.', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&q=80', true),
('TCX Hero 2 Waterproof Boots', 'Boots', 11999.00, 'Adventure boots with reinforced shin plate and gear-shift pad.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', false),
('Rynox Rain Pro Jacket & Pant', 'Rain Gear', 4499.00, 'Two-piece monsoon rainwear with taped seams and hi-viz panels.', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=80', true),
('Viaterra Fender Tail Bag 20L', 'Luggage', 4999.00, 'Waterproof tail bag with quick-mount straps for weekend rides.', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', true),
('Cramster Cool Balaclava', 'Base Layer', 899.00, 'Moisture-wicking balaclava that keeps helmet liners fresh.', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80', true),
('Rynox Elbow Guards', 'Elbow Guards', 2299.00, 'CE Level 1 elbow armour with breathable sleeve fit.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', true);

-- seed events
INSERT INTO public.events (title, description, location, event_date, image_url) VALUES
('Tamhini Ghat Sunrise Run', 'Early start from Pune, breakfast stop at Mulshi, easy pace with corner coaching.', 'Pune, Maharashtra', now() + interval '9 days', 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=1200&q=80'),
('Nandi Hills Safe-Riding Clinic', 'Braking and cornering drills with certified instructors, gear check included.', 'Bengaluru, Karnataka', now() + interval '16 days', 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=1200&q=80'),
('Coorg Monsoon Tour', 'Three-day ride through coffee country with support vehicle and homestays.', 'Coorg, Karnataka', now() + interval '31 days', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80'),
('Delhi Night Ride & Chai Stop', 'Relaxed 60 km city loop, reflective gear mandatory.', 'New Delhi', now() + interval '5 days', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80');

-- seed leaderboard
INSERT INTO public.leaderboard_entries (rider_name, points, safe_rides, week, challenge_name) VALUES
('Arjun Mehta', 2480, 14, '2026-W37', 'Smooth Throttle Week'),
('Neha Kulkarni', 2310, 12, '2026-W37', 'Smooth Throttle Week'),
('Rahul Verma', 2185, 13, '2026-W37', 'Smooth Throttle Week'),
('Sana Qureshi', 1970, 11, '2026-W37', 'Smooth Throttle Week'),
('Vikram Nair', 1845, 10, '2026-W37', 'Smooth Throttle Week'),
('Ishita Rao', 1620, 9, '2026-W37', 'Smooth Throttle Week'),
('Karan Sidhu', 1490, 8, '2026-W37', 'Smooth Throttle Week'),
('Meera Joshi', 1305, 7, '2026-W37', 'Smooth Throttle Week');