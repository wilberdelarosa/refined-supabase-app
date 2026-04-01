import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { FadeInUp } from '@/components/animations/ScrollAnimations';
import { cn } from '@/lib/utils';

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
];

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Autoplay
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="py-20 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-foreground/[0.02] blur-3xl pointer-events-none" />

      <div className="container relative">
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Lo que dicen nuestros clientes
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Testimonios
            </h2>
          </div>
        </FadeInUp>

        {/* Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-14 z-10 h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-card hover:scale-110 transition-all duration-300"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-14 z-10 h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-card hover:scale-110 transition-all duration-300"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex-[0_0_100%] min-w-0 px-4 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="h-full"
                  >
                    <div className="group h-full bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                      {/* Quote accent */}
                      <Quote className="absolute top-4 right-4 h-16 w-16 text-foreground/[0.04] group-hover:text-foreground/[0.08] transition-colors duration-500" />

                      {/* Stars */}
                      <div className="flex gap-0.5 mb-5">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                        ))}
                      </div>

                      {/* Content */}
                      <p className="text-foreground/80 leading-relaxed mb-8 relative z-10 text-sm md:text-base">
                        "{t.content}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm shrink-0">
                          {t.initials}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === selectedIndex
                    ? "w-8 bg-foreground"
                    : "w-2 bg-foreground/20 hover:bg-foreground/40"
                )}
                aria-label={`Ir a testimonio ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
