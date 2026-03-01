
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShopFiltersProps {
  categories: string[];
  selectedCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  inStockOnly: boolean;
  onInStockChange: (checked: boolean) => void;
  featuredOnly: boolean;
  onFeaturedChange: (checked: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  className?: string;
  isMobile?: boolean; // To adjust layout if needed
}

export function ShopFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  inStockOnly,
  onInStockChange,
  featuredOnly,
  onFeaturedChange,
  hasActiveFilters,
  onClearFilters,
  className,
  isMobile = false
}: ShopFiltersProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Header if needed */}
      {!isMobile && (
        <div className="flex items-center gap-2 font-semibold text-lg pb-2 border-b">
          <SlidersHorizontal className="h-5 w-5" />
          Filtros
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Categorías</h3>
        <div className="space-y-2">
          <Button
            variant={selectedCategory === undefined ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start font-normal",
              selectedCategory === undefined && "font-medium"
            )}
            onClick={() => onCategoryChange(undefined)}
          >
            Todos los productos
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start font-normal",
                selectedCategory === category && "font-medium"
              )}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Precio</h3>
        <div className="pt-2 px-2">
          <Slider
            defaultValue={[0, 50000]} // Assuming a max price for now, can be dynamic
            value={priceRange}
            max={50000}
            step={100}
            minStepsBetweenThumbs={1}
            onValueChange={(value) => onPriceChange(value as [number, number])}
            className="mb-6"
          />
          <div className="flex items-center justify-between text-sm">
            <div className="border rounded px-2 py-1 min-w-[4rem] text-center">
              RD${priceRange[0]}
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="border rounded px-2 py-1 min-w-[4rem] text-center">
              RD${priceRange[1]}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Status Filters */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Estado</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="in-stock" 
              checked={inStockOnly}
              onCheckedChange={(checked) => onInStockChange(checked as boolean)}
            />
            <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">En Stock</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="featured" 
              checked={featuredOnly}
              onCheckedChange={(checked) => onFeaturedChange(checked as boolean)}
            />
            <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">Destacados</Label>
          </div>
        </div>
      </div>

      {/* Active Filters Summary / Clear Button */}
      {hasActiveFilters && (
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full text-muted-foreground hover:text-foreground border-dashed"
            onClick={onClearFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
