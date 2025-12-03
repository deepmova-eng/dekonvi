import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface Product extends Listing {
  seller?: Profile;
}

export function useProduct(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      if (!productId) {
        setError('ID du produit manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add timeout to handle hanging queries
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        );

        // Fetch product with seller data
        // NOTE: No status filter here - RLS policies handle access control
        // Admins & owners can see pending, public sees only active
        const productQuery = supabase
          .from('listings')
          .select(`
            *,
            profiles:seller_id (
              id,
              name,
              avatar_url,
              rating,
              total_ratings,
              is_recommended
            )
          `)
          .eq('id', productId)
          .single();

        const { data, error: productError } = await Promise.race([
          productQuery,
          timeoutPromise
        ]) as any;

        if (productError) throw productError;

        // Count seller's active listings
        const countQuery = supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', data.seller_id)
          .eq('status', 'active');

        const { count: activeListingsCount } = await Promise.race([
          countQuery,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
        ]) as any;

        if (isMounted) {
          setProduct({
            ...data,
            seller: data.profiles ? {
              ...data.profiles,
              activeListings: activeListingsCount || 0
            } : undefined
          });
        }
      } catch (err) {
        console.error('Error fetching product:', err);

        // Fallback to direct REST API if client fails
        if (err instanceof Error && err.message === 'Query timeout') {
          console.log('Switching to REST API fallback for product...');
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // Fetch product with seller profile
            const response = await fetch(
              `${supabaseUrl}/rest/v1/listings?select=*,profiles:seller_id(id,name,avatar_url,rating,total_ratings,is_recommended)&id=eq.${productId}`,
              {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`
                }
              }
            );

            if (response.ok) {
              const responseData = await response.json();
              if (responseData && responseData.length > 0) {
                const data = responseData[0];

                // Fetch active listings count
                const countResponse = await fetch(
                  `${supabaseUrl}/rest/v1/listings?select=id&seller_id=eq.${data.seller_id}&status=eq.active`,
                  {
                    headers: {
                      'apikey': supabaseAnonKey,
                      'Authorization': `Bearer ${supabaseAnonKey}`,
                      'Prefer': 'count=exact'
                    }
                  }
                );

                let activeListingsCount = 0;
                if (countResponse.ok) {
                  const countHeader = countResponse.headers.get('content-range');
                  if (countHeader) {
                    const match = countHeader.match(/\/(\d+)$/);
                    if (match) activeListingsCount = parseInt(match[1], 10);
                  }
                }

                if (isMounted) {
                  setProduct({
                    ...data,
                    seller: data.profiles ? {
                      ...data.profiles,
                      activeListings: activeListingsCount
                    } : undefined
                  });
                }
                return;
              }
            }
          } catch (fetchErr) {
            console.error('REST API fallback error:', fetchErr);
          }
        }

        if (isMounted) {
          setError('Une erreur est survenue lors du chargement du produit');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    // Subscribe to changes
    const channel = supabase
      .channel(`product:${productId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
          filter: `id=eq.${productId}`
        },
        () => {
          fetchProduct();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return { product, loading, error };
}