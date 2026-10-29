CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.sweeps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pile text NOT NULL,
  pile_chars integer NOT NULL,
  is_example boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'running',
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sweeps TO authenticated;
GRANT ALL ON public.sweeps TO service_role;
ALTER TABLE public.sweeps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own sweeps" ON public.sweeps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX sweeps_user_created ON public.sweeps (user_id, created_at DESC);

-- Starts a sweep while enforcing per-session caps. Raises friendly-coded errors.
CREATE OR REPLACE FUNCTION public.start_sweep(_pile text, _is_example boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _count int;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF _pile IS NULL OR length(btrim(_pile)) < 20 THEN RAISE EXCEPTION 'PILE_TOO_SMALL'; END IF;
  IF length(_pile) > 30000 THEN RAISE EXCEPTION 'PILE_TOO_LARGE'; END IF;
  SELECT count(*) INTO _count FROM public.sweeps
    WHERE user_id = _uid AND created_at > now() - interval '24 hours';
  IF _count >= 3 THEN RAISE EXCEPTION 'DAILY_LIMIT'; END IF;
  INSERT INTO public.sweeps (user_id, pile, pile_chars, is_example)
    VALUES (_uid, _pile, length(_pile), coalesce(_is_example, false))
    RETURNING id INTO _id;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.start_sweep(text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_sweep(text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_sweep_result(_id uuid, _result jsonb, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.sweeps SET result = _result, status = coalesce(_status, status), updated_at = now()
    WHERE id = _id AND user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.save_sweep_result(uuid, jsonb, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_sweep_result(uuid, jsonb, text) TO authenticated;