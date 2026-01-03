import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Loader2, Ban } from 'lucide-react';
import { useMyAppointments } from '../hooks/useAppointments';
import { appointmentsAPI } from '../api';
import { toast } from 'sonner';

export default function MyAppointmentsPage() {
  const { appointments, loading, error, reload } = useMyAppointments();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  async function handleCancel(id: string) {
    try {
      await appointmentsAPI.cancelAppointment(id, 'Usuario canceló la cita');
      toast.success('Cita cancelada');
      reload();
    } catch (err) {
      toast.error('No se pudo cancelar la cita');
    }
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Mis Citas</h1>
            <p className="text-muted-foreground">Consulta y gestiona tus citas con nutricionistas</p>
          </div>
          <Button asChild variant="outline">
            <a href="/appointments">Agendar nueva</a>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p>Cargando citas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Aún no tienes citas agendadas.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <Card key={appt.id} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Cita #{appt.id.slice(0, 8).toUpperCase()}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {appt.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{appt.created_at ? new Date(appt.created_at).toLocaleDateString('es-DO') : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{appt.consultation_type?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Sesión virtual/presencial</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-semibold">RD${appt.total_price?.toFixed(2)}</div>
                  </div>

                  {appt.status === 'pending' || appt.status === 'confirmed' ? (
                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => handleCancel(appt.id)}>
                        <Ban className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
