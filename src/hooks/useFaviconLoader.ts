import { useEffect } from 'react';

/**
 * Hook pour animer le favicon lors du retour sur l'onglet
 * VERSION TEST : Se déclenche aussi au premier chargement pour vérifier que ça marche
 */
export const useFaviconLoader = () => {
    useEffect(() => {
        console.log('🎨🎨🎨 FAVICON LOADER: Hook initialisé !!! 🎨🎨🎨');

        // TEST : Animation au premier chargement
        setTimeout(() => {
            console.log('▶️ TEST: Déclenchement animation au chargement');
            animateFavicon();
        }, 2000); // 2 secondes après le chargement

        const handleVisibilityChange = () => {
            console.log(`👁️ Visibility changed: ${document.visibilityState}`);

            if (document.visibilityState === 'visible') {
                console.log('✨ ANIMATION DÉCLENCHE PAR TAB CHANGE');
                animateFavicon();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            console.log('🧹 Cleanup hook');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const animateFavicon = () => {
        console.log('🎬🎬🎬 ANIMATION START 🎬🎬🎬');

        // Récupère le favicon
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

        if (!link) {
            console.log('⚠️ Aucun favicon, création...');
            link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/png';
            document.head.appendChild(link);
        }

        console.log('📌 Favicon actuel:', link.href);
        const originalIcon = link.href;

        // Canvas simple pour test
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('❌ Pas de Canvas context');
            return;
        }

        let frame = 0;
        const totalFrames = 20;

        console.log('🎞️ Démarrage animation 20 frames...');

        const timer = setInterval(() => {
            ctx.clearRect(0, 0, 32, 32);

            // Animation simple : cercle qui se remplit
            const progress = frame / totalFrames;

            // Cercle de fond (gris)
            ctx.beginPath();
            ctx.arc(16, 16, 12, 0, 2 * Math.PI);
            ctx.fillStyle = '#e5e7eb';
            ctx.fill();

            // Cercle vert qui grandit
            ctx.beginPath();
            ctx.arc(16, 16, 12 * progress, 0, 2 * Math.PI);
            ctx.fillStyle = '#10b981';
            ctx.fill();

            link.href = canvas.toDataURL('image/png');

            if (frame % 5 === 0) {
                console.log(`📊 Frame ${frame}/${totalFrames}`);
            }

            frame++;

            if (frame > totalFrames) {
                clearInterval(timer);
                console.log('✅ Animation terminée, restauration favicon');
                setTimeout(() => {
                    link.href = originalIcon || '/favicon.ico';
                }, 500);
            }
        }, 50);
    };
};
