import { Link } from 'react-router-dom';

const categories = [
  {
    name: 'Proteínas',
    subtitle: 'Whey, Isolate, Caseína',
    slug: 'proteinas',
    dark: false,
  },
  {
    name: 'Creatina',
    subtitle: 'Monohidrato, HCl',
    slug: 'creatina',
    dark: true,
  },
  {
    name: 'Vitaminas y Minerales',
    subtitle: 'Multivitamínicos, Omega-3',
    slug: 'vitaminas',
    dark: false,
  },
  {
    name: 'Pre-Entrenos',
    subtitle: 'Energía y enfoque',
    slug: 'pre-entrenos',
    dark: true,
  },
];

export function Categories() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in">
          Categorías
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in">
          Explora nuestra selección de suplementos de las mejores marcas del mundo
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              className={`group relative aspect-square rounded-sm overflow-hidden flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-2 shadow-smooth hover:shadow-smooth-lg ${category.dark
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-foreground'
                } animate-scale-in-smooth opacity-0`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Bottle icon placeholder */}
              <div className="w-16 h-24 md:w-20 md:h-28 mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg
                  viewBox="0 0 60 100"
                  fill="currentColor"
                  className={`w-full h-full ${category.dark ? 'opacity-30' : 'opacity-20'} transition-opacity duration-300 group-hover:opacity-40`}
                >
                  <rect x="18" y="8" width="24" height="12" rx="2" />
                  <rect x="12" y="20" width="36" height="72" rx="4" />
                </svg>
              </div>
              <h3 className="font-bold text-xs md:text-sm uppercase tracking-wide transition-transform duration-300 group-hover:translate-y-[-2px]">
                {category.name}
              </h3>
              <p className={`text-[10px] md:text-xs mt-1 ${category.dark ? 'opacity-60' : 'text-muted-foreground'} transition-opacity duration-300 group-hover:opacity-80`}>
                {category.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
