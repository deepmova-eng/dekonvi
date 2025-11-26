import { z } from 'zod';

// Schéma de validation pour les annonces
export const listingSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre ne doit pas dépasser 100 caractères'),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.number()
    .min(0, 'Le prix ne peut pas être négatif'),
  location: z.string()
    .min(1, 'La localisation est requise'),
  category: z.string()
    .min(1, 'La catégorie est requise'),
  images: z.array(z.string())
    .min(1, 'Au moins une image est requise')
    .max(10, 'Maximum 10 images autorisées'),
  deliveryAvailable: z.boolean().optional(),
  isPremium: z.boolean().optional()
});

// Schéma de validation pour les utilisateurs
export const userSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string()
    .email('Email invalide'),
  phone: z.string()
    .regex(/^\+?[0-9]{8,}$/, 'Numéro de téléphone invalide')
    .optional(),
  location: z.string().optional(),
  avatar: z.string().url().optional()
});

// Schéma de validation pour les messages
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Le message ne peut pas être vide')
    .max(1000, 'Le message ne doit pas dépasser 1000 caractères'),
  conversationId: z.string(),
  senderId: z.string()
});

// Schéma de validation pour les signalements
export const reportSchema = z.object({
  listingId: z.string(),
  reason: z.string()
    .min(1, 'La raison est requise'),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères'),
  reporterId: z.string()
});

// Fonction de validation générique
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
      error: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: error.errors[0].message
      };
    }
    return {
      success: false,
      data: null,
      error: 'Erreur de validation'
    };
  }
};