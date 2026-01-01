import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-fitness.png';

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-black dark:bg-gray-950">
      {/* Background Image with enhanced overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Atleta fitness"
          className="w-full h-full object-cover object-center grayscale"
        />
        <div className="absolute inset-0 hero-overlay" />
        {/* Additional gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent dark:from-gray-950/80 dark:via-gray-950/50" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-2 text-white drop-shadow-2xl">
            <span className="italic">IMPULSA TU</span>
          </h1>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 text-gray-400 dark:text-gray-500 drop-shadow-2xl">
            RENDIMIENTO
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-lg font-medium drop-shadow-lg">
            Suplementos deportivos premium al mejor precio en República Dominicana
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold uppercase tracking-wide shadow-xl hover-glow"
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
              className="border-white/60 text-white hover:bg-white/10 dark:border-white/80 dark:text-white dark:hover:bg-white/20 font-bold uppercase tracking-wide backdrop-blur-sm shadow-lg hover-lift"
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
