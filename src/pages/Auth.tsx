import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  fullName: z.string().optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = authSchema.safeParse({ email, password, fullName });
    if (!result.success) {
      toast({ title: 'Error', description: result.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, fullName);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (!isLogin) {
      toast({ title: '¡Bienvenido!', description: 'Cuenta creada exitosamente' });
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container max-w-md py-12 md:py-20">
        <div className="bg-card border border-border rounded-lg shadow-smooth-lg p-8 md:p-10 animate-scale-in-smooth">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 transition-all duration-300">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-muted-foreground transition-all duration-300">
              {isLogin ? 'Accede a tu cuenta Barbaro Nutrition' : 'Únete a la comunidad Barbaro Nutrition'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-slide-up">
                <Label htmlFor="fullName" className="text-sm font-medium">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 transition-all duration-300 focus:ring-2"
                  placeholder="Tu nombre completo"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 transition-all duration-300 focus:ring-2"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 transition-all duration-300 focus:ring-2"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-6 font-semibold uppercase tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse-subtle">Cargando...</span>
                </span>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-foreground font-semibold hover:underline transition-all duration-300 hover:translate-x-0.5 inline-block"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
}
