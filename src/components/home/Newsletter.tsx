import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScaleIn, FadeInUp } from '@/components/animations/ScrollAnimations';

export function Newsletter() {
  return (
    <section className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <ScaleIn>
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-background/20">
              <span className="text-sm font-bold uppercase tracking-wider">Únete a la Tribu</span>
            </div>
          </ScaleIn>
          
          <FadeInUp delay={0.2}>
            <h2 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-lg">
              ¿Listo para ser parte de la tribu?
            </h2>
          </FadeInUp>
          
          <FadeInUp delay={0.3}>
            <p className="text-lg md:text-xl text-background/80 mb-10 max-w-xl mx-auto leading-relaxed font-medium">
              Explora nuestra selección de suplementos premium y comienza tu transformación hoy mismo.
            </p>
          </FadeInUp>

          <ScaleIn delay={0.5}>
          <Button 
            size="lg" 
            className="bg-background text-foreground hover:bg-background/90 font-bold uppercase tracking-wide shadow-2xl hover-glow px-8 py-6 text-lg"
            asChild
          >
            <Link to="/shop">Ver Productos</Link>
          </Button>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}
