interface UserAvatarProps {
    user: {
        avatar_url?: string;
        user_metadata?: {
            avatar_url?: string;
            name?: string;
        };
        full_name?: string;
        name?: string;
        email?: string;
    } | null;
    size?: string;
    showStatus?: boolean;
    className?: string;
}

/**
 * UserAvatar - Affiche l'avatar utilisateur avec fallback gradient + initiale
 * 
 * Si avatar_url existe → affiche l'image
 * Sinon → cercle gradient avec première lettre du nom/email
 */
export default function UserAvatar({
    user,
    size = "w-10 h-10",
    showStatus = false,
    className = ""
}: UserAvatarProps) {
    // Récupérer l'URL de l'avatar (plusieurs sources possibles)
    const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;

    // Récupérer le nom pour l'initiale
    const displayName = user?.full_name || user?.name || user?.user_metadata?.name || user?.email || "?";
    const initial = displayName.charAt(0).toUpperCase();

    // Si image existe → affichage classique
    if (avatarUrl) {
        return (
            <div className={`relative ${className}`}>
                <img
                    src={avatarUrl}
                    alt="Profil"
                    className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
                />
                {showStatus && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
            </div>
        );
    }

    // Sinon → Avatar avec initiale et gradient "Ultra Pro"
    return (
        <div className={`relative ${className}`}>
            <div
                className={`${size} rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white`}
                style={{ fontSize: size.includes('10') ? '16px' : size.includes('8') ? '14px' : '12px' }}
            >
                {initial}
            </div>
            {showStatus && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
        </div>
    );
}
