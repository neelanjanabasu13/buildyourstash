CREATE TABLE public.workshop_jobs (
 sweep_id uuid PRIMARY KEY REFERENCES public.sweeps(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','failed','done')),
 step text NOT NULL DEFAULT 'extract',
 attempts integer NOT NULL DEFAULT 0,
 lease_token uuid,
 lease_until timestamptz,
 error text,
 progress jsonb NOT NULL DEFAULT '{}'::jsonb,
 events jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshop_jobs TO authenticated;
GRANT ALL ON public.workshop_jobs TO service_role;
ALTER TABLE public.workshop_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own jobs" ON public.workshop_jobs FOR SELECT TO authenticated USING(user_id = auth.uid());
CREATE INDEX workshop_jobs_owner ON public.workshop_jobs(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_jobs;
CREATE OR REPLACE FUNCTION public.create_workshop_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.workshop_jobs(sweep_id,user_id) VALUES(NEW.id,NEW.user_id); RETURN NEW; END $$;
CREATE TRIGGER create_workshop_job AFTER INSERT ON public.sweeps FOR EACH ROW EXECUTE FUNCTION public.create_workshop_job();
CREATE OR REPLACE FUNCTION public.claim_workshop_step(_id uuid,_step text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE token uuid := gen_random_uuid(); job public.workshop_jobs;
BEGIN
 SELECT * INTO job FROM public.workshop_jobs WHERE sweep_id=_id FOR UPDATE;
 IF job.sweep_id IS NULL OR job.status='done' OR job.lease_until > now() THEN RETURN NULL; END IF;
 IF job.step=_step AND job.attempts >= 3 THEN RAISE EXCEPTION 'STEP_ATTEMPT_LIMIT'; END IF;
 UPDATE public.workshop_jobs SET status='running',step=_step,attempts=CASE WHEN step=_step THEN attempts+1 ELSE 1 END,lease_token=token,lease_until=now()+interval '3 minutes',error=NULL,updated_at=now() WHERE sweep_id=_id;
 RETURN token;
END $$;
REVOKE ALL ON FUNCTION public.claim_workshop_step(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_workshop_step(uuid,text) TO service_role;
CREATE TABLE public.provider_usage (
 day date NOT NULL DEFAULT current_date,
 provider text NOT NULL CHECK(provider IN ('nebius','tavily')),
 calls integer NOT NULL DEFAULT 0,
 PRIMARY KEY(day,provider)
);
GRANT ALL ON public.provider_usage TO service_role;
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_provider_call(_provider text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE total integer; cap integer;
BEGIN
 IF _provider NOT IN ('nebius','tavily') THEN RAISE EXCEPTION 'Invalid provider'; END IF;
 cap := CASE WHEN _provider='nebius' THEN 500 ELSE 500 END;
 INSERT INTO public.provider_usage(day,provider,calls) VALUES(current_date,_provider,0) ON CONFLICT DO NOTHING;
 UPDATE public.provider_usage SET calls=calls+1 WHERE day=current_date AND provider=_provider AND calls < cap RETURNING calls INTO total;
 RETURN total IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.reserve_provider_call(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_provider_call(text) TO service_role;