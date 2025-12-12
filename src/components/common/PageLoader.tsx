import './PageLoader.css';

/**
 * Page Loader - Écran de chargement premium
 * Affiche le logo Dekonvi qui se remplit de vert pendant le chargement
 */
export function PageLoader() {
    return (
        <div className="page-loader">
            <div className="page-loader-content">
                {/* Logo qui se remplit */}
                <div className="logo-container">
                    <img
                        src="/favicon-512x512.png"
                        alt="Dekonvi"
                        className="logo-animation"
                    />
                </div>

                {/* Texte optionnel */}
                <h2 className="loader-text">Dekonvi</h2>
            </div>
        </div>
    );
}
