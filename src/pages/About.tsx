import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Users, Heart, Target } from 'lucide-react';
import entrenamientoImg from '@/assets/entrenamiento.png';
import { FadeInUp, FadeInLeft, FadeInRight, ScaleIn, StaggerContainer, StaggerItem, RotateIn, SlideInBlur } from '@/components/animations/ScrollAnimations';

const About = () => {
  const values = [
    {
      icon: Award,
      title: 'Calidad Premium',
      desc: 'Ofrecemos solo los mejores suplementos deportivos con ingredientes de la más alta calidad y respaldados por la ciencia.'
    },
    {
      icon: Users,
      title: 'Asesoría Personalizada',
      desc: 'Nuestro equipo de expertos está disponible para guiarte y ayudarte a encontrar los productos ideales para tus objetivos.'
    },
    {
      icon: Heart,
      title: 'Comunidad',
      desc: 'Más que una tienda, somos una comunidad de personas comprometidas con el fitness y el bienestar integral.'
    },
    {
      icon: Target,
      title: 'Resultados',
      desc: 'Nos enfocamos en ayudarte a alcanzar tus metas con productos efectivos y un servicio de excelencia.'
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <ScaleIn>
              <div className="inline-block mb-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground px-4 py-2 rounded-full bg-muted/50">
                  Sobre Nosotros
                </p>
              </div>
            </ScaleIn>
            <FadeInUp delay={0.2}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Conoce la historia detrás de <span className="text-primary">Barbaro Nutrition</span>
              </h1>
            </FadeInUp>
            <SlideInBlur delay={0.4}>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Y nuestra pasión por el fitness
              </p>
            </SlideInBlur>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            {/* Text Content */}
            <FadeInLeft>
            <div className="space-y-8 lg:pr-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                  Nuestra Historia
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                  Bienvenidos <br />Bárbaros
                </h2>
              </div>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  Con mucho orgullo y entusiasmo les invito a ser parte de esta tribu la que se caracterizará por ser una <strong className="text-foreground">gran familia</strong>. Que tendrá como norte mejorar cada día en una mejor versión de nosotros mismos promoviendo siempre el bienestar físico y emocional de todos sus miembros.
                </p>
                <p className="text-lg">
                  Pronto estaremos listos para iniciar con ustedes este camino el cual nos llenará de gratas experiencias y de conocimientos.
                </p>
              </div>

              <RotateIn delay={0.3}>
                <div className="pt-4">
                  <div className="border-l-4 border-primary pl-6 py-2">
                    <p className="font-bold text-foreground text-xl md:text-2xl">
                      Acompáñanos en este gran reto y sé parte de la tribu…
                    </p>
                  </div>
                </div>
              </RotateIn>
            </div>
            </FadeInLeft>

            {/* Image */}
            <FadeInRight>
            <div className="relative lg:order-last">
              <ScaleIn delay={0.2}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={entrenamientoImg}
                    alt="Entrenamiento Barbaro Nutrition"
                    className="w-full h-auto object-contain"
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </ScaleIn>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
            </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <FadeInUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                Lo que nos define
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Nuestra Misión
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl">
                Comprometidos con tu transformación física y emocional
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto" staggerDelay={0.15}>
            {values.map((item, idx) => (
              <StaggerItem key={item.title}>
                <RotateIn>
                  <Card className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                        <item.icon className="h-8 w-8" />
                      </div>
                      <h3 className="font-bold text-xl">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </RotateIn>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-foreground via-foreground to-foreground/90 text-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <ScaleIn>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                ¿Listo para ser parte de la tribu?
              </h2>
            </ScaleIn>
            <FadeInUp delay={0.2}>
              <p className="text-background/80 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
                Explora nuestra selección de suplementos premium y comienza tu transformación hoy mismo.
              </p>
            </FadeInUp>
            <FadeInUp delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 font-semibold uppercase tracking-wide text-base px-10 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300"
                asChild
              >
                <Link to="/shop">Ver Productos</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-background text-background hover:bg-background hover:text-foreground font-semibold uppercase tracking-wide text-base px-10 py-6 h-auto transition-all duration-300"
                asChild
              >
                <Link to="/contact">Contáctanos</Link>
              </Button>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
