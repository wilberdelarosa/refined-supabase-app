import { ProductNutrition } from '@/hooks/useProductNutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, AlertTriangle, Utensils } from 'lucide-react';

interface NutritionTableProps {
  nutrition: ProductNutrition;
  usageInstructions?: string | null;
}

const NUTRIENT_LABELS: Record<string, string> = {
  calories: 'Calorías',
  protein: 'Proteína',
  carbohydrates: 'Carbohidratos',
  fat: 'Grasa Total',
  fiber: 'Fibra',
  sodium: 'Sodio',
  sugar: 'Azúcares',
  saturated_fat: 'Grasa Saturada',
  cholesterol: 'Colesterol',
};

const NUTRIENT_UNITS: Record<string, string> = {
  calories: 'kcal',
  protein: 'g',
  carbohydrates: 'g',
  fat: 'g',
  fiber: 'g',
  sodium: 'mg',
  sugar: 'g',
  saturated_fat: 'g',
  cholesterol: 'mg',
};

export default function NutritionTable({ nutrition, usageInstructions }: NutritionTableProps) {
  const facts = nutrition.nutrition_facts || {};
  const mainNutrients = Object.entries(facts).filter(
    ([key, val]) => key !== 'other' && val !== undefined && val !== null && val !== ''
  );
  const otherNutrients = (facts as any).other as Array<{ name: string; value: string }> | undefined;

  return (
    <div className="space-y-6">
      {/* Nutrition Facts */}
      <Card className="border-2 border-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Beaker className="h-5 w-5" />
            Información Nutricional
          </CardTitle>
          {nutrition.serving_size && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Tamaño de porción: <span className="font-medium text-foreground">{nutrition.serving_size}</span></p>
              {nutrition.servings_per_container && (
                <p>Porciones por envase: <span className="font-medium text-foreground">{nutrition.servings_per_container}</span></p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border-t-4 border-foreground pt-2">
            {mainNutrients.map(([key, value], i) => (
              <div
                key={key}
                className={`flex justify-between py-1.5 text-sm ${
                  i === 0 ? 'font-bold text-base border-b-4 border-foreground pb-2' : 'border-b border-border'
                }`}
              >
                <span>{NUTRIENT_LABELS[key] || key}</span>
                <span className="font-semibold">
                  {value} {NUTRIENT_UNITS[key] || ''}
                </span>
              </div>
            ))}
            {otherNutrients && otherNutrients.length > 0 && (
              <>
                <div className="border-t-2 border-foreground/20 mt-2 pt-2">
                  {otherNutrients.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 text-sm border-b border-border last:border-0">
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      {nutrition.ingredients && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ingredientes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed">{nutrition.ingredients}</p>
          </CardContent>
        </Card>
      )}

      {/* Allergens */}
      {nutrition.allergens && nutrition.allergens.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alérgenos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {nutrition.allergens.map((allergen, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{allergen}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      {usageInstructions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Modo de Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed">{usageInstructions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
