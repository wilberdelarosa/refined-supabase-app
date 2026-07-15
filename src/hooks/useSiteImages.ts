import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteImage {
  id: string;
  slot: string;
  image_url: string | null;
  alt_text: string | null;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  recommended_width: number | null;
  recommended_height: number | null;
  recommended_format: string | null;
  max_size_kb: number | null;
  description: string | null;
}

// Cache to avoid refetching across many components
let cache: SiteImage[] | null = null;
const listeners = new Set<(images: SiteImage[]) => void>();
let inflight: Promise<SiteImage[]> | null = null;

async function loadAll(): Promise<SiteImage[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase
      .from('site_images' as never)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error loading site images', error);
      return [];
    }
    cache = (data ?? []) as unknown as SiteImage[];
    listeners.forEach((l) => l(cache!));
    inflight = null;
    return cache;
  })();
  return inflight;
}

export function invalidateSiteImagesCache() {
  cache = null;
  inflight = null;
  loadAll();
}

export function useSiteImages() {
  const [images, setImages] = useState<SiteImage[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;
    const l = (imgs: SiteImage[]) => {
      if (mounted) setImages(imgs);
    };
    listeners.add(l);
    loadAll().then((imgs) => {
      if (mounted) {
        setImages(imgs);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      listeners.delete(l);
    };
  }, []);

  return { images, loading };
}

export function useSiteImage(slot: string, fallbackUrl?: string) {
  const { images, loading } = useSiteImages();
  const image = images.find((i) => i.slot === slot && i.is_active);
  return {
    url: image?.image_url || fallbackUrl || null,
    alt: image?.alt_text || '',
    title: image?.title || null,
    subtitle: image?.subtitle || null,
    linkUrl: image?.link_url || null,
    image,
    loading,
  };
}
