export const optimizeImage = (url: string, width: number) => {
  // Si l'URL est d'Unsplash, utiliser leurs paramètres d'optimisation
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=80&auto=format,compress`;
  }

  // Si l'URL est de Firebase Storage, ajouter le paramètre de redimensionnement
  if (url.includes('firebasestorage.googleapis.com')) {
    return `${url}?width=${width}`;
  }

  return url;
};

export const preloadImage = (url: string) => {
  const img = new Image();
  img.src = url;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const generateBlurHash = async (_imageUrl: string) => {
  // Implémenter la génération de blurhash pour le chargement progressif
  // Cette fonctionnalité nécessite une bibliothèque supplémentaire
};