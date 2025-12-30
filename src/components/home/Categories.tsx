import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';

export function Categories() {
  const { categories } = useProducts();

  // Default categories with images if none exist
  const defaultCategories = [
    { name: 'Ropa', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80' },
    { name: 'Accesorios', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80' },
    { name: 'Hogar', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80' },
  ];

  const displayCategories = categories.length > 0 
    ? categories.slice(0, 3).map((cat, i) => ({
        name: cat,
        image: defaultCategories[i % defaultCategories.length].image
      }))
    : defaultCategories;

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">
            Explora
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
            Categorías
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayCategories.map((category, index) => (
            <Link
              key={category.name}
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl font-bold text-background">
                  {category.name}
                </h3>
                <p className="text-background/70 text-sm mt-1 group-hover:translate-x-2 transition-transform">
                  Ver productos →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
