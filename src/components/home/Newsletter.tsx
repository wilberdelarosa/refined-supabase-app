import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "¡Gracias por suscribirte!",
      description: "Recibirás las últimas novedades en tu correo."
    });
    
    setEmail('');
    setLoading(false);
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">
            Newsletter
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-4">
            Únete a la Tribu
          </h2>
          <p className="text-muted-foreground mb-8">
            Suscríbete para recibir ofertas exclusivas, nuevos lanzamientos y contenido especial.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={loading} className="button-shadow">
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  Suscribirse
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            Al suscribirte aceptas nuestra política de privacidad
          </p>
        </div>
      </div>
    </section>
  );
}
