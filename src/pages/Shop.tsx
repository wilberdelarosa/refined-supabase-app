import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const { products, categories, loading } = useProducts(category === 'all' ? undefined : category);

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">Tienda</h1>
          <p className="text-muted-foreground mt-2">Explora nuestra colección</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button variant={category === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSearchParams({})}>
            Todos
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ category: cat })}
            >
              {cat}
            </Button>
          ))}
        </div>

        <ProductGrid products={products} loading={loading} />
      </div>
    </Layout>
  );
}
