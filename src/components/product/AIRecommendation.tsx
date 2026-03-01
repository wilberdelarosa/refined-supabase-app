import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sparkles, Clock, Package2, User, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface AIRecommendationProps {
  productName: string;
  productCategory: string;
}

interface RecommendationSections {
  momento?: string;
  combinar?: string;
  perfil?: string;
}

export default function AIRecommendation({ productName, productCategory }: AIRecommendationProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [sections, setSections] = useState<RecommendationSections | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function generateRecommendation() {
    setLoading(true);
    setError(false);
    setRecommendation(null);
    setSections(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-recommendation', {
        body: { productName, productCategory },
      });

      if (fnError) throw fnError;

      const rec = data?.recommendation || 'No se pudo generar una recomendación.';
      setRecommendation(rec);

      if (data?.sections && typeof data.sections === 'object') {
        const s = data.sections as RecommendationSections;
        if (s.momento || s.combinar || s.perfil) {
          setSections(s);
        }
      }
    } catch (e) {
      console.error('AI recommendation error:', e);
      setError(true);
      setRecommendation('Error al generar recomendación.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setRecommendation(null);
    setSections(null);
    setError(false);
  }

  const hasStructuredSections = sections && (sections.momento || sections.combinar || sections.perfil);

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Recomendación con IA</h3>
            <p className="text-xs text-muted-foreground">
              Consejos personalizados según el producto
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : !recommendation ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Obtén recomendaciones sobre cuándo tomarlo, con qué combinarlo y para quién es ideal.
            </p>
            <Button
              onClick={generateRecommendation}
              className="w-full gap-2 h-11"
            >
              <Sparkles className="h-4 w-4" />
              Generar recomendación
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                No se pudo conectar. Intenta de nuevo.
              </p>
            )}

            {hasStructuredSections ? (
              <div className="space-y-4">
                {sections!.momento && (
                  <div className="flex gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="shrink-0 p-1.5 rounded-md bg-background">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Mejor momento
                      </h4>
                      <p className="text-sm leading-relaxed">{sections!.momento}</p>
                    </div>
                  </div>
                )}
                {sections!.combinar && (
                  <div className="flex gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="shrink-0 p-1.5 rounded-md bg-background">
                      <Package2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Combinar con
                      </h4>
                      <p className="text-sm leading-relaxed">{sections!.combinar}</p>
                    </div>
                  </div>
                )}
                {sections!.perfil && (
                  <div className="flex gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="shrink-0 p-1.5 rounded-md bg-background">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Perfil ideal
                      </h4>
                      <p className="text-sm leading-relaxed">{sections!.perfil}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                <p className="text-sm leading-relaxed text-foreground">{recommendation}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Generar otra
              </Button>
              {error && (
                <Button size="sm" onClick={generateRecommendation} className="gap-2">
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
