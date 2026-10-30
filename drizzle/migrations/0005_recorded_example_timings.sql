ALTER TABLE public.workshop_examples ADD COLUMN timings jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE public.radar_query_attempts (
 sweep_id uuid NOT NULL REFERENCES public.sweeps(id) ON DELETE CASCADE,
 round_id uuid NOT NULL,
 kind text NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 lease_until timestamptz,
 PRIMARY KEY(sweep_id,round_id,kind)
);
GRANT ALL ON public.radar_query_attempts TO service_role;
ALTER TABLE public.radar_query_attempts ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_radar_query(_sweep_id uuid,_idea_id text,_round_id uuid,_kind text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE state jsonb; attempt public.radar_query_attempts;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.sweeps WHERE id=_sweep_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Idea not found'; END IF;
 IF _kind NOT IN ('blocker','competitors','events') THEN RAISE EXCEPTION 'Invalid radar slot'; END IF;
 SELECT value INTO state FROM public.sweep_parts WHERE sweep_id=_sweep_id AND part='radar-round:'||_idea_id FOR UPDATE;
 IF state IS NULL OR state->>'id'<>_round_id::text OR coalesce((state->>'done')::boolean,false) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.sweep_parts WHERE sweep_id=_sweep_id AND part='radar-search:'||_round_id::text||':'||_kind) THEN RETURN false; END IF;
 INSERT INTO public.radar_query_attempts(sweep_id,round_id,kind) VALUES(_sweep_id,_round_id,_kind) ON CONFLICT DO NOTHING;
 SELECT * INTO attempt FROM public.radar_query_attempts WHERE sweep_id=_sweep_id AND round_id=_round_id AND kind=_kind FOR UPDATE;
 IF attempt.attempts>=3 OR attempt.lease_until>now() THEN RETURN false; END IF;
 UPDATE public.radar_query_attempts SET attempts=attempts+1,lease_until=now()+interval '30 seconds' WHERE sweep_id=_sweep_id AND round_id=_round_id AND kind=_kind;
 IF NOT state->'queries' ? _kind THEN UPDATE public.sweep_parts SET value=jsonb_set(state,'{queries}',state->'queries'||to_jsonb(_kind)) WHERE sweep_id=_sweep_id AND part='radar-round:'||_idea_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_radar_query(uuid,text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_radar_query(uuid,text,uuid,text) TO authenticated;