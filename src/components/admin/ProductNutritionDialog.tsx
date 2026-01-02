import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Plus
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
    other?: Array<{ name: string; value: string }>;
  };
  ingredients: string;
  allergens: string[];
  suggestions?: string;
}

interface ProductNutritionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productCategory: string;
  existingNutrition?: NutritionData | null;
  onSaved: () => void;
}

export default function ProductNutritionDialog({
  open,
  onOpenChange,
  productId,
  productName,
  productCategory,
  existingNutrition,
  onSaved
}: ProductNutritionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [data, setData] = useState<NutritionData>(existingNutrition || {
    serving_size: '',
    servings_per_container: 30,
    nutrition_facts: {},
    ingredients: '',
    allergens: []
  });
  const [newAllergen, setNewAllergen] = useState('');

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-nutrition', {
        body: { productName, productCategory }
      });

      if (error) throw error;

      if (result?.success && result?.data) {
        setData(result.data);
        toast({
          title: '✨ Información generada',
          description: 'Revisa y ajusta los valores según sea necesario'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Información Nutricional
          </DialogTitle>
          <DialogDescription>
            {productName} • {productCategory}
          </DialogDescription>
        </DialogHeader>

        {/* AI Generate Button */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Generar con IA</p>
              <p className="text-sm text-muted-foreground">
                Busca información nutricional típica para este producto
              </p>
            </div>
          </div>
          <Button 
            onClick={handleAiGenerate} 
            disabled={aiLoading}
            variant="secondary"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Serving Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tamaño de porción</Label>
              <Input
                placeholder="Ej: 30g, 1 scoop"
                value={data.serving_size}
                onChange={(e) => setData({ ...data, serving_size: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Porciones por envase</Label>
              <Input
                type="number"
                min="1"
                value={data.servings_per_container}
                onChange={(e) => setData({ ...data, servings_per_container: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Nutrition Facts */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Información Nutricional</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Calorías</Label>
                <Input
                  placeholder="120 kcal"
                  value={data.nutrition_facts.calories || ''}
                  onChange={(e) => updateNutritionFact('calories', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Proteína</Label>
                <Input
                  placeholder="24g"
                  value={data.nutrition_facts.protein || ''}
                  onChange={(e) => updateNutritionFact('protein', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Carbohidratos</Label>
                <Input
                  placeholder="3g"
                  value={data.nutrition_facts.carbohydrates || ''}
                  onChange={(e) => updateNutritionFact('carbohydrates', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Grasas</Label>
                <Input
                  placeholder="1g"
                  value={data.nutrition_facts.fat || ''}
                  onChange={(e) => updateNutritionFact('fat', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Fibra</Label>
                <Input
                  placeholder="0g"
                  value={data.nutrition_facts.fiber || ''}
                  onChange={(e) => updateNutritionFact('fiber', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Sodio</Label>
                <Input
                  placeholder="50mg"
                  value={data.nutrition_facts.sodium || ''}
                  onChange={(e) => updateNutritionFact('sodium', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingredientes</Label>
            <Textarea
              placeholder="Lista de ingredientes separados por coma..."
              value={data.ingredients}
              onChange={(e) => setData({ ...data, ingredients: e.target.value })}
              rows={3}
            />
          </div>

          {/* Allergens */}
          <div className="space-y-3">
            <Label>Alérgenos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {data.allergens.map((allergen) => (
                <Badge 
                  key={allergen} 
                  variant="secondary" 
                  className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
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
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Lácteos, Soja, Gluten"
                value={newAllergen}
                onChange={(e) => setNewAllergen(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
              />
              <Button type="button" variant="outline" onClick={addAllergen}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
