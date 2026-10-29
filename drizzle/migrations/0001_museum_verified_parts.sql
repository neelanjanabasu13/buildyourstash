CREATE TABLE public.sweep_parts (
  sweep_id uuid NOT NULL REFERENCES public.sweeps(id) ON DELETE CASCADE,
  part text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sweep_id, part)
);
GRANT SELECT ON public.sweep_parts TO authenticated;
GRANT ALL ON public.sweep_parts TO service_role;
ALTER TABLE public.sweep_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own verified parts" ON public.sweep_parts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sweeps s WHERE s.id = sweep_id AND s.user_id = auth.uid()));
CREATE INDEX sweeps_museum_owner_idx ON public.sweeps(user_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.start_sweep(_pile text, _is_example boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $function$
DECLARE _uid uuid := auth.uid(); _count int; _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_SIGNED_IN'; END IF;
  IF _pile IS NULL OR length(btrim(_pile)) < 8 THEN RAISE EXCEPTION 'PILE_TOO_SMALL'; END IF;
  IF length(_pile) > 30000 THEN RAISE EXCEPTION 'PILE_TOO_LARGE'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text,0));
  SELECT count(*) INTO _count FROM public.sweeps WHERE user_id = _uid AND created_at > now() - interval '24 hours';
  IF _count >= 3 THEN RAISE EXCEPTION 'DAILY_LIMIT'; END IF;
  INSERT INTO public.sweeps (user_id,pile,pile_chars,is_example) VALUES (_uid,_pile,length(_pile),coalesce(_is_example,false)) RETURNING id INTO _id;
  RETURN _id;
END $function$;
GRANT EXECUTE ON FUNCTION public.start_sweep(text,boolean) TO authenticated;