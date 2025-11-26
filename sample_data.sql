-- Sample Data for Dekonvi Application
-- User: jay@deko.com (f5f63ea8-1d38-42a4-bc17-5b7ff2d63145)

INSERT INTO public.listings (title, description, price, location, images, category, seller_id, status, delivery_available, is_premium) VALUES

-- Immobilier
('Appartement 2 pièces Lomé Centre', 'Bel appartement de 2 pièces en plein centre de Lomé, proche de tous les commerces. Cuisine équipée, salle de bain moderne.', 150000, 'Lomé, Togo', 
 ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
 'immobilier', 
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, false),

('Villa 4 pièces Kara', 'Magnifique villa de 4 pièces à Kara avec jardin. Quartier calme et sécurisé. Idéale pour famille.', 250000, 'Kara, Togo',
 ARRAY['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
 'immobilier',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, true),

-- Véhicules
('Toyota Corolla 2018', 'Toyota Corolla 2018 en excellent état. 45000 km, climatisation, vitres électriques. Première main.', 12000000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
 'vehicules',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, true),

('Moto Yamaha 125cc', 'Moto Yamaha 125cc, 2020. Très peu utilisée, parfait état. Économique en carburant.', 800000, 'Sokodé, Togo',
 ARRAY['https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800'],
 'vehicules',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, false),

-- Électronique
('iPhone 13 Pro 256GB', 'iPhone 13 Pro 256GB, état neuf. Acheté il y a 6 mois, sous garantie. Avec tous les accessoires.', 450000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800'],
 'electronique',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, true),

('Samsung TV 55 pouces 4K', 'Télévision Samsung 55 pouces 4K Smart TV. Excellent état, peu utilisée. Avec télécommande.', 280000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'],
 'electronique',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, false),

-- Mode
('Robe de soirée élégante', 'Magnifique robe de soirée, taille M. Portée une seule fois. Couleur bordeaux, très élégante.', 25000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800'],
 'mode',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, false),

('Costume homme noir', 'Costume 3 pièces (veste, pantalon, gilet) noir, taille 50. Parfait pour mariage ou cérémonie.', 45000, 'Kara, Togo',
 ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
 'mode',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, false),

-- Maison & Jardin
('Canapé 3 places cuir', 'Canapé 3 places en cuir véritable. Très confortable, couleur marron. Bon état général.', 180000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
 'maison',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, false),

('Table à manger + 6 chaises', 'Belle table à manger en bois massif avec 6 chaises. Idéale pour grande famille.', 120000, 'Atakpamé, Togo',
 ARRAY['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800'],
 'maison',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, false),

-- Loisirs
('VTT de montagne', 'VTT 21 vitesses, excellent pour randonnées. Freins à disque, suspension avant. Peu utilisé.', 150000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800'],
 'loisirs',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, false),

('Console PlayStation 5', 'PS5 avec 2 manettes et 3 jeux (FIFA, COD, Spider-Man). État neuf, sous garantie.', 380000, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'],
 'loisirs',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, true),

-- Emploi
('Développeur Web Full Stack', 'Startup tech recherche développeur full stack (React, Node.js). CDI, salaire attractif. Remote possible.', 0, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'],
 'emploi',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, false),

('Commercial terrain expérimenté', 'Entreprise de distribution recherche commercial avec expérience. Salaire fixe + commissions.', 0, 'Kara, Togo',
 ARRAY['https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800'],
 'emploi',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, false),

-- Services
('Plombier qualifié', 'Plombier professionnel avec 10 ans d''expérience. Dépannage rapide, travail soigné. Devis gratuit.', 0, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800'],
 'services',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', false, false),

('Électricien certifié', 'Électricien qualifié pour toute installation. Rapide, propre, prix compétitifs. Disponible 7j/7.', 0, 'Lomé, Togo',
 ARRAY['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'],
 'services',
 'f5f63ea8-1d38-42a4-bc17-5b7ff2d63145',
 'active', true, false);
