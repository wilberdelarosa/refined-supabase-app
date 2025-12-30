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
      <div className="container max-w-md py-20">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Accede a tu cuenta TRIBE' : 'Únete a la comunidad TRIBE'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </Layout>
  );
}
