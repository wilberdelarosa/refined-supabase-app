import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeInUp } from '@/components/animations/ScrollAnimations';

const testimonials = [
  {
    id: 1,
    name: 'Carlos Rodríguez',
    role: 'Atleta CrossFit',
    content: 'Los mejores suplementos que he probado. La calidad es excepcional y los resultados hablan por sí solos. Recomendado 100%.',
    rating: 5,
    initials: 'CR',
  },
  {
    id: 2,
    name: 'María González',
    role: 'Entrenadora Personal',
    content: 'Excelente servicio y productos de primera. Mis clientes están encantados con los resultados que obtienen.',
    rating: 5,
    initials: 'MG',
  },
  {
    id: 3,
    name: 'Pedro Martínez',
    role: 'Competidor Fitness',
    content: 'Barbaro Nutrition se ha convertido en mi tienda de confianza. Envíos rápidos y precios competitivos.',
    rating: 5,
    initials: 'PM',
  },
  {
    id: 4,
    name: 'Ana Lucía Pérez',
    role: 'Coach de Nutrición',
    content: 'La variedad de productos y la atención al cliente son insuperables. Siempre encuentro lo que necesito para mis atletas.',
    rating: 5,
    initials: 'AP',
  },
  {
    id: 5,
    name: 'Roberto Sánchez',
    role: 'Powerlifter',
    content: 'Desde que descubrí Barbaro, no compro en otro lugar. La relación calidad-precio es imbatible.',
    rating: 5,
    initials: 'RS',
  },
  {
    id: 6,
    name: 'Laura Díaz',
    role: 'Fitness Lifestyle',
    content: 'Me encanta la transparencia de sus productos. Ingredientes claros, resultados reales. ¡Los amo!',
    rating: 5,
    initials: 'LD',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-36 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container relative">
        <FadeInUp>
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4 px-4 py-1.5 rounded-full bg-primary/10">
              Testimonios
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4">
              Lo que dicen nuestros
              <br />
              <span className="text-primary">clientes</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl mt-4 max-w-2xl mx-auto">
              Miles de atletas confían en nosotros para alcanzar sus metas
            </p>
          </div>
        </FadeInUp>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: 'easeOut' }}
            >
              <div className="group relative h-full bg-card border border-border/60 rounded-2xl p-7 md:p-8 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-500">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/[0.07] group-hover:text-primary/[0.15] transition-colors duration-500" />

                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="text-foreground/85 leading-relaxed mb-8 text-[15px] md:text-base relative z-10">
                  "{t.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-primary/20">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight">{t.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
