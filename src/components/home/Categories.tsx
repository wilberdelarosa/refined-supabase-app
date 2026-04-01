import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeInUp } from '@/components/animations/ScrollAnimations';

const categories = [
  {
    name: 'Proteínas',
    subtitle: 'Whey · Isolate · Caseína',
    slug: 'proteinas',
    emoji: '💪',
  },
  {
    name: 'Creatina',
    subtitle: 'Monohidrato · HCl',
    slug: 'creatina',
    emoji: '⚡',
  },
  {
    name: 'Vitaminas',
    subtitle: 'Multivitamínicos · Omega-3',
    slug: 'vitaminas',
    emoji: '🧬',
  },
  {
    name: 'Pre-Entrenos',
    subtitle: 'Energía · Enfoque · Pump',
    slug: 'pre-entrenos',
    emoji: '🔥',
  },
];

export function Categories() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <FadeInUp>
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Explora por categoría
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Nuestras Categorías
            </h2>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Link
                to={`/shop?category=${cat.slug}`}
                className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-card border border-border hover:border-foreground/20 transition-all duration-500 hover:shadow-xl"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/5 group-hover:to-foreground/10 transition-all duration-500" />
                
                {/* Emoji icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl md:text-7xl opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
                  {cat.emoji}
                </div>

                {/* Content at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-black text-sm md:text-base uppercase tracking-wide mb-1">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
                        {cat.subtitle}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
