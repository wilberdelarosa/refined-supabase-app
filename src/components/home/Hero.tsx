import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-fitness.png';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] flex items-center overflow-hidden bg-foreground">
      {/* Background Image */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          src={heroImage}
          alt="Atleta fitness de alto rendimiento"
          className="w-full h-full object-cover object-[75%_20%] sm:object-[65%_30%] grayscale opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4">
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground/90">
                Suplementos Premium RD
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.85] mb-2 text-primary-foreground">
              <span className="italic">IMPULSA</span>
            </h1>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.85] mb-6 text-primary-foreground/40">
              TU RENDIMIENTO
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-primary-foreground/70 mb-8 sm:mb-10 leading-relaxed max-w-lg font-medium"
          >
            Suplementos deportivos de las mejores marcas del mundo, al mejor precio en República Dominicana.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <Button
              size="lg"
              className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-bold uppercase tracking-wide shadow-2xl text-sm sm:text-base h-12 sm:h-14 px-8 rounded-full group"
              asChild
            >
              <Link to="/shop">
                Comprar Ahora
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/50 font-bold uppercase tracking-wide h-12 sm:h-14 px-8 rounded-full transition-all duration-300 backdrop-blur-sm"
              asChild
            >
              <Link to="/about">
                Conocer Más
              </Link>
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
