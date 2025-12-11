import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useNetwork } from '../../hooks/useNetwork';
import type { Database } from '../../types/supabase';

type Advertisement = Database['public']['Tables']['advertisements']['Row'];

const SLIDE_DURATION = 7000; // 7 seconds in milliseconds
const PROGRESS_UPDATE_INTERVAL = 10; // Update every 10ms for smooth animation

export default function AdvertisingSlider() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const isOnline = useNetwork();

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
          return;
        }
      } catch (error) {
        console.error(`Failed to fetch advertisements (attempt ${attempt}):`, error);
        if (attempt === retries) {
          setAds([]);
          return;
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }, [isOnline]);

  useEffect(() => {
    // Initial fetch
    fetchAdsWithRetry();

    // Poll every 60 seconds (ads change rarely)
    console.log('⏱️ [ADS] Setting up polling for ads (60s)...');

    const pollAds = () => {
      if (document.hidden) {
        console.log('💤 [ADS] Tab inactive, skipping poll');
        return;
      }
      console.log('🔄 [ADS] Polling for ad updates...');
      fetchAdsWithRetry();
    };

    const pollingInterval = setInterval(pollAds, 60000); // 60s

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchAdsWithRetry();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAdsWithRetry]);

  // Handle auto-rotation and progress
  useEffect(() => {
    if (ads.length <= 1) return;

    // Reset progress and start time when changing slides
    setProgress(0);
    setStartTime(Date.now());

    // Progress update interval
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(newProgress);
    }, PROGRESS_UPDATE_INTERVAL);

    // Slide change interval
    const slideInterval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % ads.length);
      setStartTime(Date.now());
      setProgress(0);
    }, SLIDE_DURATION);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [currentIndex, ads.length, startTime]);

  if (ads.length === 0) return null;

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Main Slide */}
          <div className="relative h-64 overflow-hidden">
            {ads.map((ad, index) => {
              let position = index - currentIndex;
              if (position < 0) position = ads.length + position;

              return (
                <a
                  key={ad.id}
                  href={ad.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(${position * 100}%)` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent z-10"></div>
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
                    <h3 className="text-2xl font-bold mb-2">{ad.title}</h3>
                    {ad.description && (
                      <p className="text-sm text-gray-200">{ad.description}</p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>

          {/* Progress Dots */}
          {ads.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-30">
              {ads.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 transition-all duration-300 rounded-full bg-white/30 ${index === currentIndex ? 'w-12' : 'w-2'
                    }`}
                >
                  {index === currentIndex && (
                    <div
                      className="h-full bg-white rounded-full transition-transform ease-linear"
                      style={{
                        transform: `scaleX(${progress / 100})`,
                        transformOrigin: 'left',
                        transitionDuration: '10ms'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}