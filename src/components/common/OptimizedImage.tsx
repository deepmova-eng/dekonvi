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
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!containerRef.current || loading === 'eager') return;

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
                rootMargin: '50px',
            }
        );

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [loading]);

    useEffect(() => {
        // Check if image is already loaded (e.g. from cache)
        if (imageRef.current?.complete) {
            handleLoad();
        }
    }, [isInView]); // Check when image is rendered

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setError(true);
        // Even on error, we mark as loaded to remove placeholder/skeleton
        setIsLoaded(true);
    };

    return (
        <div
            ref={containerRef}
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
                    ref={imageRef}
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
