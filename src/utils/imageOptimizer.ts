import imageCompression from 'browser-image-compression';

/**
 * Options pour l'optimisation d'image
 */
interface OptimizeOptions {
    maxWidth: number;
    quality: number;
    fileType?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Optimise une image côté client avant upload
 * @param file - Fichier image à optimiser
 * @param options - Options de compression
 * @returns Fichier optimisé
 */
export async function optimizeImage(
    file: File,
    options: OptimizeOptions
): Promise<File> {
    const { maxWidth, quality, fileType = 'image/webp' } = options;

    try {
        const compressionOptions = {
            maxSizeMB: 1, // Taille max finale: 1 Mo
            maxWidthOrHeight: maxWidth,
            useWebWorker: true,
            fileType: fileType,
            initialQuality: quality,
        };

        console.log('🖼️ Optimisation image:', {
            original: `${(file.size / 1024 / 1024).toFixed(2)} Mo`,
            targetWidth: maxWidth,
            quality: quality,
        });

        const compressedFile = await imageCompression(file, compressionOptions);

        console.log('✅ Image optimisée:', {
            avant: `${(file.size / 1024 / 1024).toFixed(2)} Mo`,
            après: `${(compressedFile.size / 1024).toFixed(2)} Ko`,
            réduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
        });

        return compressedFile;
    } catch (error) {
        console.error('❌ Erreur optimisation image:', error);
        // En cas d'erreur, retourner le fichier original
        return file;
    }
}

/**
 * Presets d'optimisation pour différents cas d'usage
 */
export const OPTIMIZE_PRESETS = {
    /** Images de produits (annonces) - Max 1200px, quality 0.8 */
    PRODUCT: { maxWidth: 1200, quality: 0.8 },

    /** Avatars utilisateurs - Max 400px, quality 0.8 */
    AVATAR: { maxWidth: 400, quality: 0.8 },

    /** Bannières publicitaires - Max 1200px, quality 0.8 */
    BANNER: { maxWidth: 1200, quality: 0.8 },

    /** Photos preuves avis clients - Max 800px, quality 0.7 */
    REVIEW_PROOF: { maxWidth: 800, quality: 0.7 },
} as const;

/**
 * Optimise plusieurs images en parallèle
 * @param files - Liste de fichiers à optimiser
 * @param options - Options de compression
 * @returns Liste de fichiers optimisés
 */
export async function optimizeImages(
    files: File[],
    options: OptimizeOptions
): Promise<File[]> {
    return Promise.all(files.map((file) => optimizeImage(file, options)));
}
