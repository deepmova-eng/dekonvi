import { useEffect, useState, memo } from 'react';
import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type TickerData = {
    current_listing_id?: string | null;
    listing?: {
        id: string;
        title: string;
        price: number;
    } | null;
};

function TickerDisplayOnly() {
    const [tickerData, setTickerData] = useState<TickerData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTicker = async () => {
        console.log('🎯 Ticker: Fetching data...');
        try {
            const { data, error } = await supabase
                .from('ticker_spot')
                .select(`
          current_listing_id,
          listing:listings!ticker_spot_current_listing_id_fkey (
            id,
            title,
            price
          )
        `)
                .single();

            if (error) {
                console.error('❌ Ticker fetch error:', error);
            } else {
                console.log('✅ Ticker data:', data);
                setTickerData(data as any);
            }
        } catch (err) {
            console.error('❌ Ticker unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchTicker();

        // Polling every 15 seconds (more reliable than Realtime on this instance)
        console.log('⏱️ Ticker: Setting up polling (every 15s)...');
        const pollingInterval = setInterval(() => {
            console.log('🔄 Ticker: Polling for updates...');
            fetchTicker();
        }, 15000); // 15 seconds

        return () => {
            console.log('🛑 Ticker: Cleaning up polling interval');
            clearInterval(pollingInterval);
        };
    }, []);

    if (loading) {
        return null; // Don't show while loading
    }

    const hasListing = tickerData?.listing;
    const displayText = hasListing
        ? `★ ${hasListing.title} - ${hasListing.price.toLocaleString('fr-FR')}F`
        : '⭐ Première place disponible - 200F !';

    // Check if text is long (needs scrolling)
    const isLongText = displayText.length > 40;

    // Create stable key to prevent re-creation of animation DOM elements
    const animationKey = hasListing ? `ticker-${hasListing.id}` : 'ticker-empty';

    // Render capsule content
    const CapsuleContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            <Crown className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-yellow-400 ${isMobile ? 'mr-1' : 'mr-2'} flex-shrink-0 animate-pulse z-10`} />
            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium min-w-0 flex-1 overflow-hidden whitespace-nowrap`}>
                {isLongText ? (
                    <div key={animationKey} className={isMobile ? 'ticker-scroll-mobile' : 'ticker-scroll'}>
                        {displayText}
                    </div>
                ) : (
                    displayText
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Version - Clickable capsule */}
            {hasListing ? (
                <Link
                    to={`/listings/${hasListing.id}`}
                    className="hidden md:flex items-center bg-black text-white rounded-full px-3 py-1.5 mx-4 max-w-xs overflow-hidden relative hover:bg-gray-900 transition-colors cursor-pointer"
                >
                    <CapsuleContent />
                </Link>
            ) : (
                <div className="hidden md:flex items-center bg-black text-white rounded-full px-3 py-1.5 mx-4 max-w-xs overflow-hidden relative">
                    <CapsuleContent />
                </div>
            )}

            {/* Mobile Version - Clickable capsule */}
            {hasListing ? (
                <Link
                    to={`/listings/${hasListing.id}`}
                    className="md:hidden flex items-center bg-black text-white rounded-full px-2 py-1 mx-2 flex-1 max-w-[180px] overflow-hidden relative hover:bg-gray-900 transition-colors cursor-pointer"
                >
                    <CapsuleContent isMobile />
                </Link>
            ) : (
                <div className="md:hidden flex items-center bg-black text-white rounded-full px-2 py-1 mx-2 flex-1 max-w-[180px] overflow-hidden relative">
                    <CapsuleContent isMobile />
                </div>
            )}

            <style>{`
                @keyframes ticker-scroll {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }

                .ticker-scroll {
                    display: inline-block;
                    padding-left: 100%;
                    animation: ticker-scroll 15s linear infinite;
                    will-change: transform;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }

                .ticker-scroll:hover {
                    animation-play-state: paused;
                }

                .ticker-scroll-mobile {
                    display: inline-block;
                    padding-left: 100%;
                    animation: ticker-scroll 12s linear infinite;
                    will-change: transform;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                }
            `}</style>
        </>
    );
}

// Wrap with memo to prevent re-renders during scroll (which restarts CSS animation)
export default memo(TickerDisplayOnly);
