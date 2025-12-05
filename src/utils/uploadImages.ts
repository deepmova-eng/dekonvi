import { supabase } from '../lib/supabase'
import { optimizeImage, OPTIMIZE_PRESETS } from './imageOptimizer'

export async function uploadImages(images: any[], userId: string): Promise<string[]> {
    console.log('🔍 Starting upload for', images.length, 'images')
    console.log('🔍 User ID:', userId)
    console.log('🔍 Images structure:', images.map(img => ({ hasFile: !!img.file, fileName: img.file?.name, hasPreview: !!img.preview })))

    const uploadPromises = images.map(async (image, index) => {
        try {
            // Vérifier que l'image a un fichier
            if (!image.file) {
                console.error('❌ Image n\'a pas de propriété file:', image)
                return image.preview
            }

            // ✅ OPTIMISER l'image AVANT upload (1200px, WebP, quality 0.8)
            const optimizedFile = await optimizeImage(image.file, OPTIMIZE_PRESETS.PRODUCT)

            // Génère un nom unique pour l'image (TOUJOURS .webp maintenant)
            const timestamp = Date.now()
            const randomString = Math.random().toString(36).substring(7)
            const fileName = `${userId}/${timestamp}-${index}-${randomString}.webp`

            console.log(`📤 Upload image ${index + 1}/${images.length}:`, fileName)

            // Upload vers Supabase Storage (bucket "listings")
            const { data, error } = await supabase.storage
                .from('listings')
                .upload(fileName, optimizedFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                console.error('❌ Supabase upload error:', error)
                throw error
            }

            if (!data) {
                console.error('❌ No data returned from upload')
                throw new Error('No data returned from upload')
            }

            console.log('✅ Upload successful, data:', data)

            // Récupère l'URL publique
            const { data: urlData } = supabase.storage
                .from('listings')
                .getPublicUrl(data.path)

            const publicUrl = urlData.publicUrl

            console.log('✅ Image uploadée avec URL publique:', publicUrl)
            return publicUrl

        } catch (error) {
            console.error(`❌ Erreur upload image ${index}:`, error)
            console.error('Image data:', image)
            // En cas d'erreur, retourne le preview (fallback)
            console.warn('⚠️ Fallback to preview URL:', image.preview)
            return image.preview
        }
    })

    // Attend que tous les uploads soient terminés
    const urls = await Promise.all(uploadPromises)
    console.log('🎯 Final URLs:', urls)
    return urls
}
