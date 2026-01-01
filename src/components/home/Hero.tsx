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
          className="w-full h-full object-cover object-center grayscale transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-2 text-background animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
            <span className="italic">IMPULSA TU</span>
          </h1>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 text-muted-foreground animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s' }}>
            RENDIMIENTO
          </h1>
          <p className="text-lg md:text-xl text-background/70 mb-8 leading-relaxed max-w-md animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s' }}>
            Suplementos deportivos premium al mejor precio en República Dominicana
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.8s' }}>
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 font-semibold uppercase tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
              <Link to="/shop">
                Comprar Ahora
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 text-background hover:bg-background/10 hover:border-background/50 font-semibold uppercase tracking-wide transition-all duration-300 hover:scale-105"
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
