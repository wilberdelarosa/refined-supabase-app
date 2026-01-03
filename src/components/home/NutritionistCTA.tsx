import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppointmentFeature } from '@/features/appointments/config';

export function NutritionistCTA() {
  const showCTA = useAppointmentFeature('SHOW_PRODUCT_BANNER');

  if (!showCTA) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden border-primary/20 shadow-2xl">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Content Side */}
                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-6 w-fit">
                    <Sparkles className="h-4 w-4" />
                    Asesoría Profesional
                  </div>

                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                    ¿No sabes qué suplemento
                    <span className="text-primary block">es ideal para ti?</span>
                  </h2>

                  <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                    Agenda una consulta con nuestros nutricionistas certificados y recibe 
                    recomendaciones personalizadas según tus objetivos fitness.
                  </p>

                  {/* Benefits */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {[
                      { icon: CheckCircle, text: 'Recomendaciones personalizadas' },
                      { icon: Users, text: 'Nutricionistas certificados' },
                      { icon: Calendar, text: 'Horarios flexibles' },
                      { icon: Sparkles, text: '10% descuento en productos' },
                    ].map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * idx }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{benefit.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="text-base font-bold">
                      <Link to="/appointments">
                        <Calendar className="mr-2 h-5 w-5" />
                        Agendar Consulta
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-base">
                      <Link to="/shop">Ver Productos</Link>
                    </Button>
                  </div>

                  {/* Trust Badge */}
                  <p className="text-xs text-muted-foreground mt-6">
                    💪 Más de 500+ clientes asesorados · Consulta desde RD$1,500
                  </p>
                </div>

                {/* Image/Visual Side */}
                <div className="relative hidden lg:block bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-16 w-16 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Nutricionistas Expertos</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto">
                        Equipo de profesionales dedicados a ayudarte a alcanzar tus metas
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">500+</div>
                          <div className="text-xs text-muted-foreground">Consultas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">4.9</div>
                          <div className="text-xs text-muted-foreground">Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">98%</div>
                          <div className="text-xs text-muted-foreground">Satisfacción</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
