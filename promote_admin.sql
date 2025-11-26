-- Promouvoir le compte admin@dekonvi.com en administrateur
-- Exécutez cette requête dans le SQL Editor de Supabase

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@dekonvi.com';

-- Vérifier que le compte a bien été promu
SELECT id, name, email, role, created_at 
FROM public.profiles 
WHERE email = 'admin@dekonvi.com';
