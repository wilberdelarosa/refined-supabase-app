
import { Layout } from '@/components/layout/Layout';
import { useNativeProducts, type ShopFilters as ShopFiltersType, type ShopSortBy } from '@/hooks/useNativeProducts';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopFilters } from '@/components/shop/ShopFilters';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Search,
  Grid3X3,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/ScrollAnimations';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const SORT_OPTIONS: { value: ShopSortBy; label: string }[] = [
  { value: 'created_at', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'discount', label: 'Con descuento primero' },
  { value: 'featured', label: 'Destacados primero' },
];

export default function Shop() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<ShopSortBy>('created_at');
  // Price range state for UI (0-50000)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: ShopFiltersType = {
    category: selectedCategory,
    search: debouncedSearch || undefined,
    sortBy,
    inStockOnly,
    featuredOnly,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < 50000 ? priceRange[1] : undefined,
  };

  const { products, categories, loading, error } = useNativeProducts(filters);

  // Determine if filters are active
  const hasActiveFilters = Boolean(
    debouncedSearch ||
    selectedCategory ||
    inStockOnly ||
    featuredOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000
  );

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategory(undefined);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setPriceRange([0, 50000]);
    // Reset sort to default if desired, or keep user preference
    setSortBy('created_at');
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b backdrop-blur-3xl">
        <div className="container py-12 md:py-16 text-center md:text-left space-y-4">
          <FadeInUp>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Nuestra Tienda
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto md:mx-0 mt-4 leading-relaxed font-light">
              Descubre nuestra selección premium de productos diseñados para mejorar tu rendimiento y bienestar. Calidad garantizada en cada compra.
            </p>
          </FadeInUp>
        </div>
      </div>

      <div className="container py-8 md:py-12 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            <div className="sticky top-24">
              <ShopFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                inStockOnly={inStockOnly}
                onInStockChange={setInStockOnly}
                featuredOnly={featuredOnly}
                onFeaturedChange={setFeaturedOnly}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:py-0 mb-6 space-y-4 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-10 w-full bg-background/50 border-input hover:border-primary/50 focus:border-primary transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Mobile Filter Trigger */}
                  <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden h-10 gap-2 font-medium">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtros
                        {hasActiveFilters && (
                          <span className="flex h-2 w-2 rounded-full bg-primary" />
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                      <SheetHeader className="mb-6 text-left">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                           <SlidersHorizontal className="h-5 w-5" /> Filtros
                        </SheetTitle>
                        <SheetDescription>
                          Refina tu búsqueda para encontrar el producto ideal.
                        </SheetDescription>
                      </SheetHeader>
                      <ShopFilters
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        priceRange={priceRange}
                        onPriceChange={setPriceRange}
                        inStockOnly={inStockOnly}
                        onInStockChange={setInStockOnly}
                        featuredOnly={featuredOnly}
                        onFeaturedChange={setFeaturedOnly}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        isMobile
                      />
                    </SheetContent>
                  </Sheet>

                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as ShopSortBy)}>
                      <SelectTrigger className="w-[160px] h-10 bg-background/50">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="hidden sm:flex border rounded-md overflow-hidden bg-background/50">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-10 w-10 rounded-none hover:bg-muted"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-10" />
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-10 w-10 rounded-none hover:bg-muted"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Active filters summary if needed */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <p>
                  Mostrando <span className="font-medium text-foreground">{products.length}</span> resultados
                </p>
                {hasActiveFilters && (
                    <Button 
                        variant="link" 
                        size="sm" 
                        onClick={clearFilters} 
                        className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    >
                        Limpiar todos
                    </Button>
                )}
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div
                className={cn(
                  'grid gap-6',
                  viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-3'
                    : 'grid-cols-1'
                )}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/5] rounded-xl w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-xl border border-dashed animate-in fade-in">
                <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar productos</h3>
                <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/30 rounded-xl border border-dashed animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No encontramos productos</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Intenta ajustar los filtros de búsqueda o cambiar los términos ingresados.
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} size="lg" variant="secondary">
                    Limpiar todos los filtros
                  </Button>
                )}
              </div>
            ) : (
              <StaggerContainer
                className={cn(
                  'grid gap-6 pb-20',
                  viewMode === 'grid'
                    ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                    : 'grid-cols-1'
                )}
                staggerDelay={0.05}
              >
                {products.map((product) => (
                  <StaggerItem key={product.id} className="h-full">
                    <ProductCard product={product} variant={viewMode} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
