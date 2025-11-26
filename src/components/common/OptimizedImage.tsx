import { useState, useEffect, useRef } from 'react';
import './OptimizedImage.css';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: string;
    loading?: 'lazy' | 'eager';
    onLoad?: () => void;
}

export default function OptimizedImage({
    src,
    alt,
    className = '',
    aspectRatio = '1/1',
    loading = 'lazy',
    onLoad,
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(loading === 'eager');
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current || loading === 'eager') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
            }
        );

        observer.observe(imgRef.current);

        return () => {
            observer.disconnect();
        };
    }, [loading]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setError(true);
    };

    return (
        <div
            ref={imgRef}
            className={`optimized-image-container ${className}`}
            style={{ aspectRatio }}
        >
            {/* Blur placeholder */}
            {!isLoaded && !error && (
                <div className="optimized-image-placeholder">
                    <div className="optimized-image-skeleton" />
                </div>
            )}

            {/* Actual image */}
            {isInView && !error && (
                <img
                    src={src}
                    alt={alt}
                    className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading={loading}
                />
            )}

            {/* Error placeholder */}
            {error && (
                <div className="optimized-image-error">
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
            )}
        </div>
    );
}
