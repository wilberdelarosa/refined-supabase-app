import { Link } from 'react-router-dom';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/ScrollAnimations';

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
        <FadeInUp>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Categorías
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explora nuestra selección de suplementos de las mejores marcas del mundo
          </p>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <StaggerItem key={category.slug}>
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              className={`group relative aspect-square rounded-sm overflow-hidden flex flex-col items-center justify-center p-6 text-center transition-all hover:scale-[1.02] hover:shadow-lg ${
                category.dark 
                  ? 'bg-foreground text-background' 
                  : 'bg-muted text-foreground'
              }`}
            >
              {/* Bottle icon placeholder */}
              <div className="w-16 h-24 md:w-20 md:h-28 mb-4 flex items-center justify-center">
                <svg
                  viewBox="0 0 60 100"
                  fill="currentColor"
                  className={`w-full h-full ${category.dark ? 'opacity-30' : 'opacity-20'}`}
                >
                  <rect x="18" y="8" width="24" height="12" rx="2" />
                  <rect x="12" y="20" width="36" height="72" rx="4" />
                </svg>
              </div>
              <h3 className="font-bold text-xs md:text-sm uppercase tracking-wide">
                {category.name}
              </h3>
              <p className={`text-[10px] md:text-xs mt-1 ${category.dark ? 'opacity-60' : 'text-muted-foreground'}`}>
                {category.subtitle}
              </p>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
