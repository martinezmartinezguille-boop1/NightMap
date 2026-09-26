CREATE POLICY "Carga inicial temporal"
  ON public.discotecas FOR INSERT
  TO anon
  WITH CHECK (true);