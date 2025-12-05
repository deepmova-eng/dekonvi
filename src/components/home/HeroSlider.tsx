import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNetwork } from '../../hooks/useNetwork';
import type { Database } from '../../types/supabase';
import '../../premium-ui.css';

type Advertisement = Database['public']['Tables']['advertisements']['Row'];

const AUTO_PLAY_DELAY = 5000;

export default function HeroSlider() {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const isOnline = useNetwork();
    const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch ads logic
    const fetchAdsWithRetry = useCallback(async (retries = 3, delay = 1000) => {
        if (!isOnline) {
            console.log('Device is offline, skipping advertisement fetch');
            return;
        }

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data, error } = await supabase
                    .from('advertisements')
                    .select('*')
                    .eq('active', true)
                    .order('order_position', { ascending: true });

                if (error) {
                    console.error(`Error fetching advertisements (attempt ${attempt}):`, error);
                    if (attempt === retries) {
                        setAds([]);
                        return;
                    }
                    continue;
                }

                if (data) {
                    setAds(data);
                    // Preload images
                    data.forEach(ad => {
                        const img = new Image();
                        img.src = ad.image_url;
                    });
                    return;
                }
            } catch (error) {
                console.error(`Failed to fetch advertisements (attempt ${attempt}):`, error);
                if (attempt === retries) {
                    setAds([]);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }, [isOnline]);

    useEffect(() => {
        fetchAdsWithRetry();

        const channel = supabase
            .channel('advertisements_changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'advertisements',
                    filter: 'active=eq.true'
                },
                () => {
                    fetchAdsWithRetry();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAdsWithRetry]);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, [ads.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    }, [ads.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // Auto-play logic
    useEffect(() => {
        if (ads.length <= 1 || isPaused) {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
                autoPlayIntervalRef.current = null;
            }
            return;
        }

        autoPlayIntervalRef.current = setInterval(() => {
            nextSlide();
        }, AUTO_PLAY_DELAY);

        return () => {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
            }
        };
    }, [ads.length, isPaused, nextSlide]);

    // Images are already optimized at upload time, no transformation needed

    if (ads.length === 0) return null;

    return (
        <div className="hero-slider-container">
            <div
                className="hero-slider"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Slides */}
                {ads.map((ad, index) => (
                    <div
                        key={ad.id}
                        className={`slide ${index === currentIndex ? 'active' : ''}`}
                        data-slide={index}
                    >
                        <img
                            src={ad.image_url}
                            alt={ad.title}
                        />
                        <div className="slide-overlay"></div>
                        <div className="slide-content">
                            <h2>{ad.title}</h2>
                            {ad.description && <p>{ad.description}</p>}
                        </div>
                    </div>
                ))}

                {/* CONTROLS */}
                <div className="slider-controls">
                    <button
                        className="slider-btn prev"
                        aria-label="Slide précédent"
                        onClick={prevSlide}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <div className="slider-dots">
                        {ads.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === currentIndex ? 'active' : ''}`}
                                data-slide={index}
                                aria-label={`Slide ${index + 1}`}
                                onClick={() => goToSlide(index)}
                            ></button>
                        ))}
                    </div>

                    <button
                        className="slider-btn next"
                        aria-label="Slide suivant"
                        onClick={nextSlide}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
