import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ProofPreviewProps {
  proofUrl: string;
  onOpenLightbox?: (signedUrl: string) => void;
}

/**
 * Resolves an order-proof storage reference (either a legacy public URL or a
 * private storage path) into a short-lived signed URL and renders it.
 */
export function ProofPreview({ proofUrl, onOpenLightbox }: ProofPreviewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (/^https?:\/\//i.test(proofUrl)) {
        if (!cancelled) setSignedUrl(proofUrl);
        return;
      }
      const { data, error } = await supabase.storage
        .from('order-proofs')
        .createSignedUrl(proofUrl, 300);
      if (!cancelled) setSignedUrl(error ? null : data?.signedUrl ?? null);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [proofUrl]);

  if (!signedUrl) {
    return (
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase">Comprobante</p>
        <div className="w-full h-32 rounded-lg border border-dashed border-slate-200 bg-slate-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      <p className="text-xs font-semibold text-slate-500 uppercase">Comprobante</p>
      <div className="relative group">
        <img
          src={signedUrl}
          alt="Comprobante de pago"
          className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onOpenLightbox?.(signedUrl)}
        />
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
          onClick={() => window.open(signedUrl, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
