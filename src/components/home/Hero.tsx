import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-image.jpg';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-xl animate-fade-in">
          <span className="inline-block text-sm font-medium text-primary uppercase tracking-widest mb-4">
            Nueva Colección
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 text-balance">
            Estilo que Define tu Esencia
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Descubre piezas únicas cuidadosamente seleccionadas para personas que valoran la autenticidad y el diseño.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="button-shadow" asChild>
              <Link to="/shop">
                Explorar Tienda
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/shop?category=featured">
                Ver Destacados
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-8 h-1 rounded-full bg-primary" />
        <div className="w-2 h-1 rounded-full bg-muted-foreground/30" />
        <div className="w-2 h-1 rounded-full bg-muted-foreground/30" />
      </div>
    </section>
  );
}
