import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Flame, Compass, ShieldCheck } from 'lucide-react';
import { FadeInUp, FadeInLeft, FadeInRight, ScaleIn, StaggerContainer, StaggerItem, SlideInBlur } from '@/components/animations/ScrollAnimations';

const About = () => {
  const values = [
    {
      icon: ShieldCheck,
      title: 'Calidad Suprema',
      desc: 'Formulaciones premium respaldadas por la ciencia, utilizando materias primas de la máxima pureza certificada.'
    },
    {
      icon: Flame,
      title: 'Rendimiento Bárbaro',
      desc: 'Diseñados por y para atletas exigentes que buscan romper límites y alcanzar su máximo potencial biológico.'
    },
    {
      icon: Users,
      title: 'La Tribu',
      desc: 'Una hermandad de entusiastas del fitness unidos por el sudor, la disciplina y el hambre constante de mejora.'
    },
    {
      icon: Compass,
      title: 'Asesoría de Élite',
      desc: 'Expertos certificados listos para diseñar tu plan de suplementación personalizado según tus metas individuales.'
    },
  ];

  return (
    <Layout>
      <div className="bg-black text-white min-h-screen overflow-hidden">
        
        {/* HERO SECTION - Premium Brutalist style */}
        <section className="relative min-h-[85vh] flex items-center justify-center py-24 overflow-hidden border-b border-neutral-900">
          <div className="absolute inset-0 z-0">
            <img 
              src="/focused-fitness.png" 
              alt="Background athlete" 
              className="w-full h-full object-cover object-center opacity-25 filter grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-60" />
          </div>

          <div className="container relative z-10 mx-auto px-4 text-center">
            <ScaleIn>
              <span className="text-[hsl(var(--accent-gold))] text-xs sm:text-sm font-extrabold uppercase tracking-[0.4em] mb-4 inline-block">
                // BARBARO NUTRITION
              </span>
            </ScaleIn>
            
            <FadeInUp delay={0.2}>
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tight uppercase leading-[1.05] select-none pr-[0.15em] pb-2 overflow-visible">
                SOMOS LA <br />
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-[hsl(var(--accent-gold))] pr-[0.12em]">
                  TRIBU
                </span>
              </h1>
            </FadeInUp>
            
            <SlideInBlur delay={0.4}>
              <p className="text-neutral-400 font-light text-lg sm:text-xl max-w-xl mx-auto mt-6 leading-relaxed">
                Nuestra pasión es tu rendimiento. Suplementos deportivos premium diseñados para la élite atlética y aquellos que no aceptan límites.
              </p>
            </SlideInBlur>
          </div>
        </section>

        {/* STORY SECTION - Grid Layout with Asymmetrical elements */}
        <section className="py-24 md:py-32 relative">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
              
              {/* Text Block (Left) */}
              <div className="lg:col-span-7 space-y-8">
                <FadeInLeft>
                  <div className="space-y-4">
                    <span className="text-[hsl(var(--accent-gold))] font-mono text-xs uppercase tracking-widest block">
                      // NUESTRA HISTORIA
                    </span>
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
                      BIENVENIDOS <br/>
                      <span className="text-neutral-500">BÁRBAROS</span>
                    </h2>
                  </div>
                </FadeInLeft>

                <FadeInLeft delay={0.2} className="space-y-6 text-neutral-400 font-light text-lg leading-relaxed max-w-2xl">
                  <p>
                    Con mucho orgullo y entusiasmo les invito a ser parte de esta tribu, la cual se caracterizará por ser una <strong className="text-white font-semibold">gran familia</strong>. Nuestro norte es mejorar cada día para forjar una versión superior de nosotros mismos, promoviendo siempre el bienestar físico y emocional de todos sus miembros.
                  </p>
                  <p>
                    Aquí la suplementación no es una moda, es la herramienta fundamental que potencia tu disciplina diaria y amplifica tus resultados. Estás en el lugar donde la ciencia nutricional se encuentra con el sudor.
                  </p>
                </FadeInLeft>

                <FadeInLeft delay={0.3}>
                  <div className="border-l-2 border-[hsl(var(--accent-gold))] pl-6 py-2">
                    <p className="font-bold text-white text-xl md:text-2xl italic tracking-tight">
                      "Acompáñanos en este gran reto y sé parte de la tribu…"
                    </p>
                  </div>
                </FadeInLeft>
              </div>

              {/* Graphic Block (Right) */}
              <div className="lg:col-span-5 relative mt-8 lg:mt-0">
                <FadeInRight>
                  <div className="relative aspect-[3/4] sm:aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
                    <img 
                      src="/gym-team-bw.png" 
                      alt="Tribu Barbaro" 
                      className="w-full h-full object-cover object-center filter grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none" />
                  </div>
                </FadeInRight>

                {/* Overlapping Glass Card */}
                <ScaleIn delay={0.4} className="absolute -bottom-8 -right-4 sm:-right-8 max-w-xs p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                  <p className="text-xs text-[hsl(var(--accent-gold))] font-bold uppercase tracking-wider mb-2">Fundador & CEO</p>
                  <p className="text-sm font-medium italic text-neutral-200">
                    "Unidos por la disciplina, impulsados por el rendimiento."
                  </p>
                </ScaleIn>
              </div>

            </div>
          </div>
        </section>

        {/* QUANTIFIED SECTION - High Impact Numbers */}
        <section className="py-16 bg-neutral-950 border-y border-neutral-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-6xl mx-auto">
              <FadeInUp delay={0.1}>
                <div>
                  <h3 className="text-4xl md:text-6xl font-black text-[hsl(var(--accent-gold))] italic tracking-tighter">
                    +10K
                  </h3>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-2">
                    Atletas Activos
                  </p>
                </div>
              </FadeInUp>
              <FadeInUp delay={0.2}>
                <div>
                  <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                    99%
                  </h3>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-2">
                    Satisfacción
                  </p>
                </div>
              </FadeInUp>
              <FadeInUp delay={0.3}>
                <div>
                  <h3 className="text-4xl md:text-6xl font-black text-[hsl(var(--accent-gold))] italic tracking-tighter">
                    100%
                  </h3>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-2">
                    Garantía Pura
                  </p>
                </div>
              </FadeInUp>
              <FadeInUp delay={0.4}>
                <div>
                  <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                    +50
                  </h3>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-2">
                    Puntos de Venta
                  </p>
                </div>
              </FadeInUp>
            </div>
          </div>
        </section>

        {/* VALUES SECTION - Glassmorphic details */}
        <section className="py-24 md:py-32 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="container mx-auto px-4">
            <FadeInUp>
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span className="text-[hsl(var(--accent-gold))] font-mono text-xs uppercase tracking-widest block">
                  // LO QUE NOS DEFINE
                </span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                  NUESTRA MISIÓN
                </h2>
                <p className="text-neutral-400 font-light text-lg">
                  Llevando la suplementación deportiva al siguiente nivel con pilares inquebrantables.
                </p>
              </div>
            </FadeInUp>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto" staggerDelay={0.15}>
              {values.map((item) => (
                <StaggerItem key={item.title}>
                  <Card className="group h-full relative overflow-hidden bg-neutral-900/40 border border-neutral-800 hover:border-[hsl(var(--accent-gold))]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.05)] rounded-2xl">
                    <CardContent className="p-8 space-y-5">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-neutral-850 text-[hsl(var(--accent-gold))] group-hover:bg-[hsl(var(--accent-gold))] group-hover:text-black transition-all duration-300">
                        <item.icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-bold text-xl uppercase italic tracking-tight text-white">{item.title}</h3>
                      <p className="text-sm text-neutral-400 font-light leading-relaxed">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* CTA SECTION - Extreme Premium Overlaid style */}
        <section className="relative py-28 md:py-36 overflow-hidden border-t border-neutral-900 bg-black">
          <div className="absolute inset-0 z-0">
            <img 
              src="/crossfit-athlete.png" 
              alt="CTA Background athlete" 
              className="w-full h-full object-cover object-center opacity-30 filter grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
          </div>

          <div className="container relative z-10 mx-auto px-4">
            <div className="max-w-3xl space-y-6">
              <span className="text-[hsl(var(--accent-gold))] font-mono text-xs uppercase tracking-widest block">
                // ÚNETE A LA TRIBU
              </span>
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none text-white select-none">
                ¿LISTO PARA EL <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--accent-gold))] to-white">
                  RETO?
                </span>
              </h2>
              <p className="text-neutral-400 font-light text-lg md:text-xl max-w-xl leading-relaxed">
                Descubre nuestra selección exclusiva de suplementos deportivos diseñados para potenciar tus objetivos.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-6">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-[hsl(var(--accent-gold))] hover:text-black font-bold uppercase tracking-wider text-sm px-8 py-5 h-auto rounded-full transition-all duration-300 shadow-xl"
                  asChild
                >
                  <Link to="/shop">Ir a la Tienda</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/50 font-bold uppercase tracking-wider text-sm px-8 py-5 h-auto rounded-full transition-all duration-300"
                  asChild
                >
                  <a href="https://wa.me/18095551234" target="_blank" rel="noopener noreferrer">Asesoría WhatsApp</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default About;
