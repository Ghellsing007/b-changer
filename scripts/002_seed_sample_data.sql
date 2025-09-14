-- Seed sample data for B-Changer

-- Insert dummy user for development (matches the dummy user_id used in the app)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dummy@b-changer.dev',
  '$2a$10$dummy.hash.for.development',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, role, display_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'customer',
  'Usuario de Desarrollo',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Insert sample categories
INSERT INTO public.categories (name) VALUES 
  ('Ficción'),
  ('No Ficción'),
  ('Ciencia Ficción'),
  ('Romance'),
  ('Misterio'),
  ('Historia'),
  ('Biografía'),
  ('Tecnología'),
  ('Cocina'),
  ('Arte')
ON CONFLICT (name) DO NOTHING;

-- Insert sample authors
INSERT INTO public.authors (name) VALUES 
  ('Gabriel García Márquez'),
  ('Isabel Allende'),
  ('Mario Vargas Llosa'),
  ('Julio Cortázar'),
  ('Jorge Luis Borges'),
  ('Octavio Paz'),
  ('Laura Esquivel'),
  ('Carlos Ruiz Zafón'),
  ('Arturo Pérez-Reverte'),
  ('Almudena Grandes')
ON CONFLICT (name) DO NOTHING;

-- Insert sample publishers
INSERT INTO public.publishers (name) VALUES 
  ('Penguin Random House'),
  ('Planeta'),
  ('Alfaguara'),
  ('Anagrama'),
  ('Tusquets'),
  ('Seix Barral'),
  ('Destino'),
  ('Crítica'),
  ('Paidós'),
  ('Alianza Editorial')
ON CONFLICT (name) DO NOTHING;

-- Insert sample books
INSERT INTO public.books (title, description, category_id) 
SELECT 
  'Cien años de soledad',
  'Una obra maestra del realismo mágico que narra la historia de la familia Buendía a lo largo de siete generaciones.',
  c.id
FROM public.categories c WHERE c.name = 'Ficción'
ON CONFLICT DO NOTHING;

INSERT INTO public.books (title, description, category_id) 
SELECT 
  'La casa de los espíritus',
  'Una saga familiar que mezcla lo político y lo mágico en el Chile del siglo XX.',
  c.id
FROM public.categories c WHERE c.name = 'Ficción'
ON CONFLICT DO NOTHING;

INSERT INTO public.books (title, description, category_id) 
SELECT 
  'Rayuela',
  'Una novela experimental que puede leerse de múltiples maneras.',
  c.id
FROM public.categories c WHERE c.name = 'Ficción'
ON CONFLICT DO NOTHING;

INSERT INTO public.books (title, description, category_id) 
SELECT 
  'El laberinto de la soledad',
  'Un ensayo sobre la identidad mexicana y latinoamericana.',
  c.id
FROM public.categories c WHERE c.name = 'No Ficción'
ON CONFLICT DO NOTHING;

INSERT INTO public.books (title, description, category_id) 
SELECT 
  'Como agua para chocolate',
  'Una novela que combina recetas de cocina con una historia de amor.',
  c.id
FROM public.categories c WHERE c.name = 'Romance'
ON CONFLICT DO NOTHING;

-- Insert book-author relationships
INSERT INTO public.book_authors (book_id, author_id)
SELECT b.id, a.id
FROM public.books b, public.authors a
WHERE b.title = 'Cien años de soledad' AND a.name = 'Gabriel García Márquez'
ON CONFLICT DO NOTHING;

INSERT INTO public.book_authors (book_id, author_id)
SELECT b.id, a.id
FROM public.books b, public.authors a
WHERE b.title = 'La casa de los espíritus' AND a.name = 'Isabel Allende'
ON CONFLICT DO NOTHING;

INSERT INTO public.book_authors (book_id, author_id)
SELECT b.id, a.id
FROM public.books b, public.authors a
WHERE b.title = 'Rayuela' AND a.name = 'Julio Cortázar'
ON CONFLICT DO NOTHING;

INSERT INTO public.book_authors (book_id, author_id)
SELECT b.id, a.id
FROM public.books b, public.authors a
WHERE b.title = 'El laberinto de la soledad' AND a.name = 'Octavio Paz'
ON CONFLICT DO NOTHING;

INSERT INTO public.book_authors (book_id, author_id)
SELECT b.id, a.id
FROM public.books b, public.authors a
WHERE b.title = 'Como agua para chocolate' AND a.name = 'Laura Esquivel'
ON CONFLICT DO NOTHING;

-- Insert sample editions
INSERT INTO public.editions (book_id, publisher_id, format, isbn, publication_date)
SELECT 
  b.id,
  p.id,
  'paperback',
  '978-0-06-088328-7',
  '1967-06-05'
FROM public.books b, public.publishers p
WHERE b.title = 'Cien años de soledad' AND p.name = 'Penguin Random House'
ON CONFLICT DO NOTHING;

INSERT INTO public.editions (book_id, publisher_id, format, isbn, publication_date)
SELECT 
  b.id,
  p.id,
  'paperback',
  '978-0-553-38371-7',
  '1982-01-01'
FROM public.books b, public.publishers p
WHERE b.title = 'La casa de los espíritus' AND p.name = 'Planeta'
ON CONFLICT DO NOTHING;

INSERT INTO public.editions (book_id, publisher_id, format, isbn, publication_date)
SELECT 
  b.id,
  p.id,
  'paperback',
  '978-0-394-75284-7',
  '1963-06-28'
FROM public.books b, public.publishers p
WHERE b.title = 'Rayuela' AND p.name = 'Alfaguara'
ON CONFLICT DO NOTHING;

INSERT INTO public.editions (book_id, publisher_id, format, isbn, publication_date)
SELECT 
  b.id,
  p.id,
  'paperback',
  '978-0-8021-5084-6',
  '1950-01-01'
FROM public.books b, public.publishers p
WHERE b.title = 'El laberinto de la soledad' AND p.name = 'Paidós'
ON CONFLICT DO NOTHING;

INSERT INTO public.editions (book_id, publisher_id, format, isbn, publication_date)
SELECT 
  b.id,
  p.id,
  'paperback',
  '978-0-385-42016-2',
  '1989-01-01'
FROM public.books b, public.publishers p
WHERE b.title = 'Como agua para chocolate' AND p.name = 'Destino'
ON CONFLICT DO NOTHING;
