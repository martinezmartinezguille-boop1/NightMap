CREATE TABLE public.discotecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE,
  nombre text NOT NULL,
  latitud double precision,
  longitud double precision,
  direccion text,
  ciudad text,
  foto text,
  web text,
  telefono text,
  puntuacion numeric,
  categoria text,
  google_maps_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.discotecas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discotecas TO authenticated;
GRANT ALL ON public.discotecas TO service_role;

ALTER TABLE public.discotecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discotecas visibles para todos"
  ON public.discotecas FOR SELECT
  TO anon, authenticated
  USING (true);