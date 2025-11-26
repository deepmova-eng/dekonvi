import {
  Briefcase,
  Car,
  Building,
  Home,
  Smartphone,
  Shirt,
  Gamepad,
  Dog,
  Wrench,
  Baby,
  Plane
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  subcategories: Subcategory[];
}

export const categories: Category[] = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: Building,
    subcategories: [
      { id: 'appartement', name: 'Appartement' },
      { id: 'maison', name: 'Maison / Villa' },
      { id: 'terrain', name: 'Terrain' },
      { id: 'bureau', name: 'Bureau / Local' },
    ]
  },
  {
    id: 'vehicules',
    name: 'Véhicules',
    icon: Car,
    subcategories: [
      { id: 'voitures', name: 'Voitures' },
      { id: 'motos', name: 'Motos' },
      { id: 'camions', name: 'Camions' },
      { id: 'pieces-auto', name: 'Pièces Auto' },
    ]
  },
  {
    id: 'multimedia',
    name: 'High-Tech',
    icon: Smartphone,
    subcategories: [
      { id: 'smartphones', name: 'Smartphones' },
      { id: 'ordinateurs', name: 'Ordinateurs' },
      { id: 'tv-audio', name: 'TV & Audio' },
      { id: 'photo-video', name: 'Photo & Vidéo' },
    ]
  },
  {
    id: 'maison',
    name: 'Maison',
    icon: Home,
    subcategories: [
      { id: 'meubles', name: 'Meubles' },
      { id: 'decoration', name: 'Décoration' },
      { id: 'electromenager', name: 'Électroménager' },
      { id: 'jardin', name: 'Jardin' },
    ]
  },
  {
    id: 'mode',
    name: 'Mode',
    icon: Shirt,
    subcategories: [
      { id: 'vetements', name: 'Vêtements' },
      { id: 'chaussures', name: 'Chaussures' },
      { id: 'accessoires', name: 'Accessoires' },
      { id: 'montres', name: 'Montres & Bijoux' },
    ]
  },
  {
    id: 'loisirs',
    name: 'Loisirs',
    icon: Gamepad,
    subcategories: [
      { id: 'jeux-video', name: 'Jeux Vidéo' },
      { id: 'sport', name: 'Sport' },
      { id: 'musique', name: 'Instruments Musique' },
      { id: 'livres', name: 'Livres' },
    ]
  },
  {
    id: 'famille',
    name: 'Famille',
    icon: Baby,
    subcategories: [
      { id: 'puericulture', name: 'Puériculture' },
      { id: 'vetements-enfant', name: 'Vêtements Enfant' },
      { id: 'jouets', name: 'Jouets' },
      { id: 'equipement-bebe', name: 'Équipement Bébé' },
    ]
  },
  {
    id: 'animaux',
    name: 'Animaux',
    icon: Dog,
    subcategories: [
      { id: 'chiens', name: 'Chiens' },
      { id: 'cats', name: 'Chats' },
      { id: 'accessoires-animaux', name: 'Accessoires' },
      { id: 'autres-animaux', name: 'Autres Animaux' },
    ]
  },
  {
    id: 'emploi',
    name: 'Emploi & Services',
    icon: Briefcase,
    subcategories: [
      { id: 'offres-emploi', name: 'Offres d\'Emploi' },
      { id: 'services', name: 'Services' },
      { id: 'cours-formation', name: 'Cours & Formation' },
      { id: 'covoiturage', name: 'Covoiturage' },
    ]
  },
  {
    id: 'professionnel',
    name: 'Matériel Pro',
    icon: Wrench,
    subcategories: [
      { id: 'outils', name: 'Outils' },
      { id: 'materiel-bureau', name: 'Matériel Bureau' },
      { id: 'materiel-industriel', name: 'Matériel Industriel' },
      { id: 'restauration', name: 'Restauration' },
    ]
  },
  {
    id: 'vacances',
    name: 'Vacances',
    icon: Plane,
    subcategories: [
      { id: 'locations-vacances', name: 'Locations Vacances' },
      { id: 'camping', name: 'Camping & Caravaning' },
      { id: 'voyages', name: 'Voyages' },
      { id: 'billetterie', name: 'Billetterie' },
    ]
  }
];