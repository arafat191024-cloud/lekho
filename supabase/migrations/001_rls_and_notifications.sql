-- =============================================================================
-- Lekho — Production RLS + Notification Triggers
-- Run this entire script in the Supabase SQL Editor (Dashboard → SQL → New).
-- Safe to re-run. Creates missing optional tables, then applies RLS/triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN (
      'ahariyan173@gmail.com',
      'arafatofficial2242@gmail.com'
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Ensure optional tables exist (core tables like posts/profiles are assumed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid,
  reporter_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  post_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text,
  parent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Enable RLS only on tables that exist
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','posts','likes','comments','bookmarks','notifications',
    'follows','post_views','reports','feedbacks','profile_notes'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Drop existing policies (idempotent re-run)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','posts','likes','comments','bookmarks','notifications',
        'follows','post_views','reports','feedbacks','profile_notes'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Policies (only if the table exists)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- PROFILES
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid() OR public.is_admin()) $p$;
  END IF;

  -- POSTS
  IF to_regclass('public.posts') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "posts_select_authenticated" ON public.posts FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin()) $p$;
    EXECUTE $p$ CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin()) $p$;
  END IF;

  -- LIKES
  IF to_regclass('public.likes') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "likes_select_authenticated" ON public.likes FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "likes_update_own" ON public.likes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE TO authenticated USING (user_id = auth.uid()) $p$;
  END IF;

  -- COMMENTS
  IF to_regclass('public.comments') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "comments_select_authenticated" ON public.comments FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$
      CREATE POLICY "comments_delete_own_or_post_author" ON public.comments FOR DELETE TO authenticated
      USING (
        user_id = auth.uid()
        OR public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.posts p
          WHERE p.id = comments.post_id AND p.author_id = auth.uid()
        )
      )
    $p$;
  END IF;

  -- BOOKMARKS
  IF to_regclass('public.bookmarks') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid()) $p$;
  END IF;

  -- NOTIFICATIONS
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid()) $p$;
    EXECUTE $p$
      CREATE POLICY "notifications_insert_as_actor" ON public.notifications FOR INSERT TO authenticated
      WITH CHECK (actor_id = auth.uid() AND user_id IS DISTINCT FROM auth.uid())
    $p$;
    EXECUTE $p$ CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) $p$;
  END IF;

  -- FOLLOWS
  IF to_regclass('public.follows') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "follows_select_authenticated" ON public.follows FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$
      CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated
      WITH CHECK (follower_id = auth.uid() AND follower_id IS DISTINCT FROM following_id)
    $p$;
    EXECUTE $p$ CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid()) $p$;
  END IF;

  -- POST VIEWS
  IF to_regclass('public.post_views') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "post_views_select_authenticated" ON public.post_views FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "post_views_insert_own" ON public.post_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()) $p$;
  END IF;

  -- REPORTS
  IF to_regclass('public.reports') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "reports_select_own_or_admin" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_admin()) $p$;
    EXECUTE $p$ CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
    EXECUTE $p$ CREATE POLICY "reports_delete_admin_or_own" ON public.reports FOR DELETE TO authenticated USING (reporter_id = auth.uid() OR public.is_admin()) $p$;
  END IF;

  -- FEEDBACKS
  IF to_regclass('public.feedbacks') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "feedbacks_insert_own" ON public.feedbacks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "feedbacks_select_own_or_admin" ON public.feedbacks FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin()) $p$;
    EXECUTE $p$ CREATE POLICY "feedbacks_update_admin" ON public.feedbacks FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()) $p$;
    EXECUTE $p$ CREATE POLICY "feedbacks_delete_admin_or_own" ON public.feedbacks FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) $p$;
  END IF;

  -- PROFILE NOTES
  IF to_regclass('public.profile_notes') IS NOT NULL THEN
    EXECUTE $p$ CREATE POLICY "profile_notes_select_authenticated" ON public.profile_notes FOR SELECT TO authenticated USING (true) $p$;
    EXECUTE $p$ CREATE POLICY "profile_notes_insert_own" ON public.profile_notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "profile_notes_update_own" ON public.profile_notes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()) $p$;
    EXECUTE $p$ CREATE POLICY "profile_notes_delete_own" ON public.profile_notes FOR DELETE TO authenticated USING (user_id = auth.uid()) $p$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Notification helper (bypasses RLS for trigger inserts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_post_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RETURN;
  END IF;
  IF p_user_id IS NULL OR p_actor_id IS NULL THEN
    RETURN;
  END IF;
  IF p_user_id = p_actor_id THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND n.actor_id = p_actor_id
      AND n.type = p_type
      AND n.post_id IS NOT DISTINCT FROM p_post_id
      AND n.created_at > now() - interval '45 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, actor_id, type, post_id, is_read)
  VALUES (p_user_id, p_actor_id, p_type, p_post_id, false);
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, text, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
BEGIN
  IF NEW.type IS NULL OR NEW.type = 'unlike' THEN
    RETURN NEW;
  END IF;

  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(v_author, NEW.user_id, NEW.type, NEW.post_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author uuid;
  v_parent_author uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author FROM public.comments WHERE id = NEW.parent_id;
    PERFORM public.create_notification(v_parent_author, NEW.user_id, 'reply', NEW.post_id);

    SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
    IF v_author IS DISTINCT FROM v_parent_author THEN
      PERFORM public.create_notification(v_author, NEW.user_id, 'comment', NEW.post_id);
    END IF;
  ELSE
    SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
    PERFORM public.create_notification(v_author, NEW.user_id, 'comment', NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(NEW.following_id, NEW.follower_id, 'follow', NULL);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.likes') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_notify_on_like ON public.likes;
    CREATE TRIGGER trg_notify_on_like
      AFTER INSERT ON public.likes
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_on_like();
  END IF;

  IF to_regclass('public.comments') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
    CREATE TRIGGER trg_notify_on_comment
      AFTER INSERT ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_on_comment();
  END IF;

  IF to_regclass('public.follows') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
    CREATE TRIGGER trg_notify_on_follow
      AFTER INSERT ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_on_follow();
  END IF;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, name, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Realtime for notifications
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RETURN;
  END IF;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Indexes (skip if table missing)
DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE is_read = false;
  END IF;
  IF to_regclass('public.posts') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts (author_id, created_at DESC);
  END IF;
  IF to_regclass('public.likes') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_likes_post_user ON public.likes (post_id, user_id);
  END IF;
  IF to_regclass('public.comments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments (post_id, created_at);
  END IF;
  IF to_regclass('public.follows') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows (follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);
  END IF;
  IF to_regclass('public.bookmarks') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks (user_id, created_at DESC);
  END IF;
END $$;
