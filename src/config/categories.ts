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

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: Building
  },
  {
    id: 'vehicules',
    name: 'Véhicules',
    icon: Car
  },
  {
    id: 'multimedia',
    name: 'High-Tech',
    icon: Smartphone
  },
  {
    id: 'maison',
    name: 'Maison',
    icon: Home
  },
  {
    id: 'mode',
    name: 'Mode',
    icon: Shirt
  },
  {
    id: 'loisirs',
    name: 'Loisirs',
    icon: Gamepad
  },
  {
    id: 'famille',
    name: 'Famille',
    icon: Baby
  },
  {
    id: 'animaux',
    name: 'Animaux',
    icon: Dog
  },
  {
    id: 'emploi',
    name: 'Emploi & Services',
    icon: Briefcase
  },
  {
    id: 'professionnel',
    name: 'Matériel Pro',
    icon: Wrench
  },
  {
    id: 'vacances',
    name: 'Vacances',
    icon: Plane
  }
];