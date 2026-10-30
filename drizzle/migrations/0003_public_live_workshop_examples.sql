CREATE TABLE public.workshop_examples (
 slug text PRIMARY KEY,
 title text NOT NULL,
 result jsonb NOT NULL,
 generated_at timestamptz NOT NULL,
 source_sweep_id uuid NOT NULL,
 source_idea_id text NOT NULL
);
GRANT SELECT ON public.workshop_examples TO anon, authenticated;
GRANT ALL ON public.workshop_examples TO service_role;
ALTER TABLE public.workshop_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public generated examples only" ON public.workshop_examples FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.workshop_examples (slug,title,result,generated_at,source_sweep_id,source_idea_id)
SELECT seed.slug, seed.title, jsonb_build_object('thread',null,'ideas',jsonb_build_array(idea.value),'pileTally',s.result->'pileTally','webTally',s.result->'webTally'), s.updated_at, s.id, idea.value->'idea'->>'id'
FROM (VALUES
 ('toastmasters','A personal Toastmasters app: practise speeches, get feedback','8aa63bb5-d67f-40e3-a29e-af3be829c59b'::uuid,'idea-0'),
 ('voice-plan','A tool that turns my voice notes into a weekly plan','0ccde8ad-5b61-4dcf-8573-4a6640749705'::uuid,'idea-1'),
 ('tool-library','A neighbourhood tool library where people lend each other things','0ccde8ad-5b61-4dcf-8573-4a6640749705'::uuid,'idea-2')
) seed(slug,title,sweep_id,idea_id)
JOIN public.sweeps s ON s.id=seed.sweep_id
CROSS JOIN LATERAL jsonb_array_elements(s.result->'ideas') idea(value)
WHERE idea.value->'idea'->>'id'=seed.idea_id AND idea.value->'kit'->>'pitch' IS NOT NULL AND jsonb_array_length(idea.value->'check'->'evidence')>0;
