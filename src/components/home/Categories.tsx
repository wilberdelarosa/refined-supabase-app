import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeInUp } from '@/components/animations/ScrollAnimations';

import catProteinas from '@/assets/cat-proteinas.jpg';
import catCreatina from '@/assets/cat-creatina.jpg';
import catPreEntrenos from '@/assets/cat-pre-entrenos.jpg';
import catVitaminas from '@/assets/cat-vitaminas.jpg';
import catAminoacidos from '@/assets/cat-aminoacidos.jpg';

const categories = [
  {
    name: 'Proteínas',
    subtitle: 'Whey · Isolate · Caseína',
    slug: 'proteinas',
    image: catProteinas,
  },
  {
    name: 'Creatina',
    subtitle: 'Monohidrato · HCl',
    slug: 'creatina',
    image: catCreatina,
  },
  {
    name: 'Pre-Entrenos',
    subtitle: 'Energía · Enfoque · Pump',
    slug: 'pre-entrenos',
    image: catPreEntrenos,
  },
  {
    name: 'Vitaminas',
    subtitle: 'Multivitamínicos · Omega-3',
    slug: 'vitaminas',
    image: catVitaminas,
  },
  {
    name: 'Aminoácidos',
    subtitle: 'BCAA · Glutamina · EAA',
    slug: 'aminoacidos',
    image: catAminoacidos,
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
            >
              <Link
                to={`/shop?category=${cat.slug}`}
                className="group relative block aspect-[3/4] rounded-2xl overflow-hidden"
              >
                {/* Image */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  width={640}
                  height={800}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-black text-sm md:text-base uppercase tracking-wide mb-0.5 text-white">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] md:text-xs text-white/60 font-medium">
                        {cat.subtitle}
                      </p>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowUpRight className="h-3.5 w-3.5" />
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
