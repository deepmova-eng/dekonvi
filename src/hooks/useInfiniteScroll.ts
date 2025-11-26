import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    rootMargin?: string;
}

/**
 * Hook for implementing infinite scroll with Intersection Observer
 * @param onLoadMore - Callback to fetch next page
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether currently loading
 * @param rootMargin - Observer root margin (default: '200px')
 */
export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    rootMargin = '200px',
}: UseInfiniteScrollOptions) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            {
                rootMargin,
                threshold: 0.1,
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [onLoadMore, hasMore, isLoading, rootMargin]);

    return sentinelRef;
}
