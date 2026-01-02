import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Loader2, 
  Beaker, 
  AlertTriangle,
  X,
  Check,
  Plus,
  Info,
  Zap
} from 'lucide-react';

interface NutritionData {
  serving_size: string;
  servings_per_container: number;
  nutrition_facts: {
    calories?: string;
    protein?: string;
    carbohydrates?: string;
    fat?: string;
    fiber?: string;
    sodium?: string;
    sugar?: string;
    saturated_fat?: string;
    cholesterol?: string;
    other?: Array<{ name: string; value: string }>;
  };
  ingredients: string;
  allergens: string[];
  suggestions?: string;
  brand_info?: string;
}

interface ProductNutritionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productCategory: string;
  productDescription?: string;
  existingNutrition?: NutritionData | null;
  onSaved: () => void;
}

export default function ProductNutritionDialog({
  open,
  onOpenChange,
  productId,
  productName,
  productCategory,
  productDescription,
  existingNutrition,
  onSaved
}: ProductNutritionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [data, setData] = useState<NutritionData>({
    serving_size: '',
    servings_per_container: 30,
    nutrition_facts: {},
    ingredients: '',
    allergens: []
  });
  const [newAllergen, setNewAllergen] = useState('');
  const [newNutrient, setNewNutrient] = useState({ name: '', value: '' });

  // Reset data when dialog opens with existing nutrition
  useEffect(() => {
    if (open) {
      if (existingNutrition) {
        setData(existingNutrition);
      } else {
        setData({
          serving_size: '',
          servings_per_container: 30,
          nutrition_facts: {},
          ingredients: '',
          allergens: []
        });
      }
    }
  }, [open, existingNutrition]);

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-nutrition', {
        body: { 
          productName, 
          productCategory,
          productDescription 
        }
      });

      if (error) throw error;

      if (result?.success && result?.data) {
        setData(result.data);
        toast({
          title: '✨ Información generada',
          description: result.data.brand_info 
            ? `${result.data.brand_info.substring(0, 100)}...` 
            : 'Revisa y ajusta los valores según sea necesario'
        });
      } else if (result?.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('AI error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo generar la información',
        variant: 'destructive'
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Check if nutrition record exists
      const { data: existing } = await supabase
        .from('product_nutrition')
        .select('id')
        .eq('product_id', productId)
        .single();

      const nutritionData = {
        product_id: productId,
        serving_size: data.serving_size,
        servings_per_container: data.servings_per_container,
        nutrition_facts: data.nutrition_facts,
        ingredients: data.ingredients,
        allergens: data.allergens
      };

      if (existing) {
        const { error } = await supabase
          .from('product_nutrition')
          .update(nutritionData)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_nutrition')
          .insert(nutritionData);
        if (error) throw error;
      }

      toast({ title: 'Guardado', description: 'Información nutricional actualizada' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo guardar', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNutritionFact = (key: string, value: string) => {
    setData(prev => ({
      ...prev,
      nutrition_facts: { ...prev.nutrition_facts, [key]: value }
    }));
  };

  const addAllergen = () => {
    if (newAllergen.trim() && !data.allergens.includes(newAllergen.trim())) {
      setData(prev => ({
        ...prev,
        allergens: [...prev.allergens, newAllergen.trim()]
      }));
      setNewAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    setData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const addOtherNutrient = () => {
    if (newNutrient.name.trim() && newNutrient.value.trim()) {
      setData(prev => ({
        ...prev,
        nutrition_facts: {
          ...prev.nutrition_facts,
          other: [...(prev.nutrition_facts.other || []), { 
            name: newNutrient.name.trim(), 
            value: newNutrient.value.trim() 
          }]
        }
      }));
      setNewNutrient({ name: '', value: '' });
    }
  };

  const removeOtherNutrient = (index: number) => {
    setData(prev => ({
      ...prev,
      nutrition_facts: {
        ...prev.nutrition_facts,
        other: (prev.nutrition_facts.other || []).filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Beaker className="h-6 w-6 text-primary" />
            Información Nutricional
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <span className="font-medium text-foreground">{productName}</span>
            <Badge variant="outline">{productCategory}</Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-180px)]">
          <div className="p-6 space-y-6">
            {/* AI Generate Section */}
            <div className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-primary/15 rounded-xl shrink-0">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Generar con IA</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Busca información nutricional específica basada en el nombre del producto, 
                      marca y descripción. La IA conoce productos de marcas populares como 
                      Optimum Nutrition, MuscleTech, BSN, y más.
                    </p>
                    {productDescription && (
                      <div className="mt-2 p-2 bg-background/50 rounded-lg text-xs text-muted-foreground">
                        <span className="font-medium">Descripción:</span> {productDescription.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleAiGenerate} 
                  disabled={aiLoading}
                  size="lg"
                  className="shrink-0 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Generar Info
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Brand Info from AI */}
            {data.brand_info && (
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">{data.brand_info}</p>
              </div>
            )}

            <Separator />

            {/* Serving Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tamaño de porción</Label>
                <Input
                  placeholder="Ej: 30g (1 scoop), 2 cápsulas"
                  value={data.serving_size}
                  onChange={(e) => setData({ ...data, serving_size: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Porciones por envase</Label>
                <Input
                  type="number"
                  min="1"
                  value={data.servings_per_container}
                  onChange={(e) => setData({ ...data, servings_per_container: parseInt(e.target.value) || 0 })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Main Nutrition Facts */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Información Nutricional por Porción
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Calorías (kcal)</Label>
                  <Input
                    placeholder="120"
                    value={data.nutrition_facts.calories || ''}
                    onChange={(e) => updateNutritionFact('calories', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Proteína (g)</Label>
                  <Input
                    placeholder="24"
                    value={data.nutrition_facts.protein || ''}
                    onChange={(e) => updateNutritionFact('protein', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Carbohidratos (g)</Label>
                  <Input
                    placeholder="3"
                    value={data.nutrition_facts.carbohydrates || ''}
                    onChange={(e) => updateNutritionFact('carbohydrates', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Azúcares (g)</Label>
                  <Input
                    placeholder="1"
                    value={data.nutrition_facts.sugar || ''}
                    onChange={(e) => updateNutritionFact('sugar', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Grasas Totales (g)</Label>
                  <Input
                    placeholder="1.5"
                    value={data.nutrition_facts.fat || ''}
                    onChange={(e) => updateNutritionFact('fat', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Grasas Saturadas (g)</Label>
                  <Input
                    placeholder="0.5"
                    value={data.nutrition_facts.saturated_fat || ''}
                    onChange={(e) => updateNutritionFact('saturated_fat', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fibra (g)</Label>
                  <Input
                    placeholder="0"
                    value={data.nutrition_facts.fiber || ''}
                    onChange={(e) => updateNutritionFact('fiber', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sodio (mg)</Label>
                  <Input
                    placeholder="50"
                    value={data.nutrition_facts.sodium || ''}
                    onChange={(e) => updateNutritionFact('sodium', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Colesterol (mg)</Label>
                  <Input
                    placeholder="30"
                    value={data.nutrition_facts.cholesterol || ''}
                    onChange={(e) => updateNutritionFact('cholesterol', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Other Nutrients */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Otros Nutrientes (Vitaminas, Aminoácidos, etc.)</Label>
              {data.nutrition_facts.other && data.nutrition_facts.other.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {data.nutrition_facts.other.map((nutrient, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="gap-1 px-3 py-1.5"
                    >
                      <span className="font-medium">{nutrient.name}:</span> {nutrient.value}
                      <button
                        onClick={() => removeOtherNutrient(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Vitamina B6, BCAA, Creatina"
                  value={newNutrient.name}
                  onChange={(e) => setNewNutrient({ ...newNutrient, name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="Ej: 2mg, 5g"
                  value={newNutrient.value}
                  onChange={(e) => setNewNutrient({ ...newNutrient, value: e.target.value })}
                  className="w-32"
                />
                <Button type="button" variant="outline" onClick={addOtherNutrient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Ingredients */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ingredientes</Label>
              <Textarea
                placeholder="Lista completa de ingredientes separados por coma..."
                value={data.ingredients}
                onChange={(e) => setData({ ...data, ingredients: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Allergens */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alérgenos
              </Label>
              {data.allergens.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {data.allergens.map((allergen) => (
                    <Badge 
                      key={allergen} 
                      variant="secondary" 
                      className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 px-3 py-1.5"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {allergen}
                      <button
                        onClick={() => removeAllergen(allergen)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Lácteos, Soja, Gluten, Huevo"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                />
                <Button type="button" variant="outline" onClick={addAllergen}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Suggestions */}
            {data.suggestions && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Modo de Uso Recomendado</Label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  {data.suggestions}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Guardar Información
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
