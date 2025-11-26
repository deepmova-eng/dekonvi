import toast from 'react-hot-toast';

interface FirebaseError {
  code: string;
  message: string;
}

export const handleFirebaseError = (error: FirebaseError) => {
  let message = 'Une erreur est survenue';

  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      message = 'Email ou mot de passe incorrect';
      break;
    case 'auth/email-already-in-use':
      message = 'Cette adresse email est déjà utilisée';
      break;
    case 'auth/weak-password':
      message = 'Le mot de passe doit contenir au moins 6 caractères';
      break;
    case 'auth/invalid-email':
      message = 'Adresse email invalide';
      break;
    case 'auth/operation-not-allowed':
      message = 'Opération non autorisée';
      break;
    case 'auth/too-many-requests':
      message = 'Trop de tentatives, veuillez réessayer plus tard';
      break;
    case 'storage/unauthorized':
      message = 'Non autorisé à accéder au stockage';
      break;
    case 'storage/canceled':
      message = 'Opération annulée';
      break;
    case 'storage/unknown':
      message = 'Erreur inconnue lors du téléchargement';
      break;
    case 'permission-denied':
      message = 'Vous n\'avez pas les permissions nécessaires';
      break;
    case 'unavailable':
      message = 'Service temporairement indisponible';
      break;
    default:
      if (error.message) {
        message = error.message;
      }
  }

  toast.error(message, {
    duration: 4000,
    position: 'top-center'
  });

  return message;
};

export const handleNetworkError = () => {
  toast.error(
    'Problème de connexion. Vérifiez votre connexion internet.',
    {
      duration: 4000,
      position: 'top-center',
      icon: '🔌'
    }
  );
};