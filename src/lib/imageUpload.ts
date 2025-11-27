import { supabase } from './supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export interface ImageValidationError {
    message: string
    code: 'SIZE' | 'TYPE' | 'UNKNOWN'
}

/**
 * Valide qu'un fichier est une image valide
 */
export function validateImage(file: File): ImageValidationError | null {
    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            message: `Type non supporté. Formats acceptés : JPG, PNG, GIF, WEBP`,
            code: 'TYPE'
        }
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        return {
            message: `Fichier trop volumineux (${sizeMB} MB). Limite : 5 MB`,
            code: 'SIZE'
        }
    }

    return null
}

/**
 * Génère un nom de fichier unique
 */
export function generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = originalName.split('.').pop()
    return `${timestamp}_${random}.${extension}`
}

/**
 * Upload une image vers Supabase Storage
 */
export async function uploadMessageImage(
    file: File,
    userId: string
): Promise<{ url: string; path: string } | null> {
    try {
        // Valider l'image
        const validationError = validateImage(file)
        if (validationError) {
            console.error('Validation error:', validationError.message)
            throw new Error(validationError.message)
        }

        // Générer nom unique
        const fileName = generateFileName(file.name)
        const filePath = `${userId}/${fileName}`

        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
            .from('message-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            throw error
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('message-images')
            .getPublicUrl(filePath)

        return {
            url: publicUrl,
            path: filePath
        }
    } catch (error) {
        console.error('Error uploading image:', error)
        return null
    }
}

/**
 * Supprime une image de Supabase Storage
 */
export async function deleteMessageImage(path: string): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from('message-images')
            .remove([path])

        if (error) {
            console.error('Delete error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error deleting image:', error)
        return false
    }
}
