import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-fitness.png';

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-foreground">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Atleta fitness" 
          className="w-full h-full object-cover object-center grayscale"
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-xl animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-2 text-background">
            <span className="italic">IMPULSA TU</span>
          </h1>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 text-muted-foreground">
            RENDIMIENTO
          </h1>
          <p className="text-lg md:text-xl text-background/70 mb-8 leading-relaxed max-w-md">
            Suplementos deportivos premium al mejor precio en República Dominicana
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-background text-foreground hover:bg-background/90 font-semibold uppercase tracking-wide"
              asChild
            >
              <Link to="/shop">
                Comprar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-background/30 text-background hover:bg-background/10 font-semibold uppercase tracking-wide"
              asChild
            >
              <Link to="/about">
                Conocer Más
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
