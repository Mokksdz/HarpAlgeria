import { z } from "zod";

/**
 * Validation du téléphone algérien (10 chiffres)
 * Format: 0XXXXXXXXX où X est un chiffre
 * Exemples valides: 0551234567, 0776543210
 */
export const algerianPhoneRegex = /^0[1-9][0-9]{8}$/;

/**
 * Schema de validation pour la mise à jour du profil
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional()
    .nullable(),
  
  phone: z
    .string()
    .regex(algerianPhoneRegex, "Le numéro doit contenir 10 chiffres (ex: 0551234567)")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (AAAA-MM-JJ)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * Schema de validation pour l'inscription
 */
export const SignupSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .optional(),
  phone: z
    .string()
    .regex(algerianPhoneRegex, "Le numéro doit contenir 10 chiffres (ex: 0551234567)")
    .optional(),
});

/**
 * Schema de validation pour le checkout
 */
export const CheckoutSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z
    .string()
    .regex(algerianPhoneRegex, "Le numéro doit contenir 10 chiffres"),
  email: z.string().email("Email invalide").optional(),
  wilaya: z.string().min(1, "Wilaya requise"),
  city: z.string().min(1, "Commune requise"),
  address: z.string().min(5, "Adresse requise").optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
