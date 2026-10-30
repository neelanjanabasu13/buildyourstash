CREATE OR REPLACE FUNCTION public.begin_radar(_sweep_id uuid, _idea_id text, _force boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE previous jsonb; round_id uuid := gen_random_uuid();
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.sweeps WHERE id = _sweep_id AND user_id = auth.uid()) THEN RAISE EXCEPTION 'Exhibit not found'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.sweep_parts WHERE sweep_id = _sweep_id AND part = 'extract' AND value->'value' @> jsonb_build_array(jsonb_build_object('id', _idea_id))) THEN RAISE EXCEPTION 'Idea not found'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_sweep_id::text || _idea_id, 0));
 SELECT value INTO previous FROM public.sweep_parts WHERE sweep_id = _sweep_id AND part = 'radar-round:' || _idea_id;
 IF previous IS NOT NULL AND (previous->>'startedAt')::timestamptz > now() - interval '5 minutes' AND coalesce((previous->>'done')::boolean, false) = false THEN RETURN NULL; END IF;
 IF NOT _force AND previous IS NOT NULL AND (previous->>'startedAt')::timestamptz > now() - interval '24 hours' THEN RETURN NULL; END IF;
 INSERT INTO public.sweep_parts(sweep_id, part, value) VALUES (_sweep_id, 'radar-round:' || _idea_id, jsonb_build_object('id', round_id, 'startedAt', now(), 'queries', '[]'::jsonb, 'done', false)) ON CONFLICT(sweep_id,part) DO UPDATE SET value = excluded.value;
 RETURN round_id;
END $$;
REVOKE ALL ON FUNCTION public.begin_radar(uuid,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.begin_radar(uuid,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.claim_radar_query(_sweep_id uuid, _idea_id text, _round_id uuid, _kind text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE state jsonb;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.sweeps WHERE id = _sweep_id AND user_id = auth.uid()) THEN RAISE EXCEPTION 'Exhibit not found'; END IF;
 IF _kind NOT IN ('blocker','competitors','events') THEN RAISE EXCEPTION 'Invalid radar query'; END IF;
 SELECT value INTO state FROM public.sweep_parts WHERE sweep_id = _sweep_id AND part = 'radar-round:' || _idea_id FOR UPDATE;
 IF state IS NULL OR state->>'id' <> _round_id::text OR coalesce((state->>'done')::boolean,false) OR jsonb_array_length(state->'queries') >= 3 OR state->'queries' ? _kind THEN RETURN false; END IF;
 UPDATE public.sweep_parts SET value = jsonb_set(state, '{queries}', (state->'queries') || to_jsonb(_kind)) WHERE sweep_id = _sweep_id AND part = 'radar-round:' || _idea_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_radar_query(uuid,text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_radar_query(uuid,text,uuid,text) TO authenticated;