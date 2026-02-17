import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
}

interface ProductGalleryProps {
  productId: string;
  mainImageUrl: string | null;
  productName: string;
}

export default function ProductGallery({ productId, mainImageUrl, productName }: ProductGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    async function fetchImages() {
      const { data } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (data && data.length > 0) {
        setImages(data as ProductImage[]);
      } else if (mainImageUrl) {
        setImages([{ id: 'main', url: mainImageUrl, alt_text: productName, is_primary: true, display_order: 0 }]);
      }
    }
    fetchImages();
  }, [productId, mainImageUrl, productName]);

  const allImages = images.length > 0 ? images : (mainImageUrl ? [{ id: 'main', url: mainImageUrl, alt_text: productName, is_primary: true, display_order: 0 }] : []);

  if (allImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-background border">
        <img
          src={allImages[selectedIndex]?.url}
          alt={allImages[selectedIndex]?.alt_text || productName}
          className="w-full h-full object-contain p-6 transition-transform duration-300 hover:scale-110"
        />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                i === selectedIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
              }`}
            >
              <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
