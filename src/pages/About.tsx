import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Award, Users, Heart, Target } from 'lucide-react';

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Sobre Nosotros
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Conoce la historia detrás de Barbaro Nutrition
            </h1>
            <p className="text-lg text-muted-foreground">
              Y nuestra pasión por el fitness
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
                Nuestra Historia
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Bienvenidos Bárbaros
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Con mucho orgullo y entusiasmo les invito a ser parte de esta tribu la que se caracterizará por ser una gran familia. Que tendrá como norte mejorar cada día en una mejor versión de nosotros mismos promoviendo siempre el bienestar físico y emocional de todos sus miembros.
                </p>
                <p>
                  Pronto estaremos listos para iniciar con ustedes este camino el cual nos llenará de gratas experiencias y de conocimientos.
                </p>
                <p className="font-semibold text-foreground">
                  Acompáñanos en este gran reto y sé parte de la tribu…
                </p>
              </div>
            </div>
            <div className="bg-muted aspect-square rounded-sm flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold">B</span>
                </div>
                <p className="font-bold text-xl">BARBARO</p>
                <p className="text-muted-foreground">NUTRITION</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4 text-center">
            Lo que nos define
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Nuestra Misión
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Award, title: 'Calidad Premium', desc: 'Ofrecemos solo los mejores suplementos deportivos con ingredientes de la más alta calidad y respaldados por la ciencia.' },
              { icon: Users, title: 'Asesoría Personalizada', desc: 'Nuestro equipo de expertos está disponible para guiarte y ayudarte a encontrar los productos ideales para tus objetivos.' },
              { icon: Heart, title: 'Comunidad', desc: 'Más que una tienda, somos una comunidad de personas comprometidas con el fitness y el bienestar integral.' },
              { icon: Target, title: 'Resultados', desc: 'Nos enfocamos en ayudarte a alcanzar tus metas con productos efectivos y un servicio de excelencia.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 bg-foreground text-background rounded-sm flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para ser parte de la tribu?
          </h2>
          <p className="text-background/70 mb-8 max-w-xl mx-auto">
            Explora nuestra selección de suplementos premium y comienza tu transformación hoy mismo.
          </p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold uppercase tracking-wide" asChild>
            <Link to="/shop">Ver Productos</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default About;
