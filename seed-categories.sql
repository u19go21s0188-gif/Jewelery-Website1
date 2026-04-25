-- Insert default categories for Maison Émeraude
INSERT INTO public.categories (name, slug, description, is_visible, sort_order) VALUES
  ('Necklaces', 'necklaces', 'Elegant necklaces and pendants', true, 1),
  ('Earrings', 'earrings', 'Exquisite earrings and studs', true, 2),
  ('Rings', 'rings', 'Fine rings and statement pieces', true, 3),
  ('Bracelets', 'bracelets', 'Beautiful bracelets and bangles', true, 4)
ON CONFLICT (name) DO NOTHING;
