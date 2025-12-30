import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Newsletter() {
  return (
    <section className="py-16 md:py-24 bg-foreground text-background">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para ser parte de la tribu?
          </h2>
          <p className="text-background/70 mb-8">
            Explora nuestra selección de suplementos premium y comienza tu transformación hoy mismo.
          </p>

          <Button 
            size="lg" 
            className="bg-background text-foreground hover:bg-background/90 font-semibold uppercase tracking-wide"
            asChild
          >
            <Link to="/shop">Ver Productos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
