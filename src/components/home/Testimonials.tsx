import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Carlos Rodríguez',
    role: 'Atleta CrossFit',
    content: 'Los mejores suplementos que he probado. La calidad es excepcional y los resultados hablan por sí solos. Recomendado 100%.',
    rating: 5,
  },
  {
    id: 2,
    name: 'María González',
    role: 'Entrenadora Personal',
    content: 'Excelente servicio y productos de primera. Mis clientes están encantados con los resultados que obtienen.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Pedro Martínez',
    role: 'Competidor Fitness',
    content: 'Barbaro Nutrition se ha convertido en mi tienda de confianza. Envíos rápidos y precios competitivos.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Testimonios
        </h2>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-card border border-border rounded-sm p-6 md:p-8"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground/80 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
