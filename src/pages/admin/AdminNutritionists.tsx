import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Star,
  Users,
  Settings,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Nutritionist {
  id: string;
  user_id: string;
  specialization: string[];
  bio: string | null;
  price_per_session: number;
  consultation_duration: number;
  rating: number;
  total_consultations: number;
  is_active: boolean;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null };
}

interface Appointment {
  id: string;
  client_id: string;
  nutritionist_id: string;
  slot_id: string;
  consultation_type: string;
  status: string;
  client_data: Record<string, any>;
  total_price: number;
  paid: boolean;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null };
  nutritionists?: { profiles?: { full_name: string | null } };
}

interface Slot {
  id: string;
  nutritionist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const SPECIALIZATIONS = [
  'Nutrición deportiva',
  'Pérdida de peso',
  'Ganancia muscular',
  'Nutrición clínica',
  'Alimentación saludable',
  'Suplementación',
];

export default function AdminNutritionists() {
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [slotsDialogOpen, setSlotsDialogOpen] = useState(false);
  const [selectedNutritionist, setSelectedNutritionist] = useState<Nutritionist | null>(null);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    specialization: [] as string[],
    bio: '',
    price_per_session: 1500,
    consultation_duration: 60,
    is_active: true,
  });

  // Slot form state
  const [slotForm, setSlotForm] = useState({
    date: '',
    start_time: '09:00',
    end_time: '10:00',
  });

  // Available users for nutritionist selection
  const [availableUsers, setAvailableUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([
      loadNutritionists(),
      loadAppointments(),
      loadAvailableUsers(),
    ]);
    setLoading(false);
  }

  async function loadNutritionists() {
    const { data, error } = await supabase
      .from('nutritionists' as any)
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNutritionists(data as unknown as Nutritionist[]);
    }
  }

  async function loadAppointments() {
    const { data, error } = await supabase
      .from('appointments' as any)
      .select('*, profiles:client_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setAppointments(data as unknown as Appointment[]);
    }
  }

  async function loadAvailableUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .order('full_name');

    if (!error && data) {
      setAvailableUsers(data);
    }
  }

  async function loadSlots(nutritionistId: string) {
    const { data, error } = await supabase
      .from('appointment_slots' as any)
      .select('*')
      .eq('nutritionist_id', nutritionistId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('start_time');

    if (!error && data) {
      setSlots(data as unknown as Slot[]);
    }
  }

  async function handleSaveNutritionist() {
    if (!formData.user_id) {
      toast.error('Selecciona un usuario');
      return;
    }

    const payload = {
      user_id: formData.user_id,
      specialization: formData.specialization,
      bio: formData.bio || null,
      price_per_session: formData.price_per_session,
      consultation_duration: formData.consultation_duration,
      is_active: formData.is_active,
    };

    if (selectedNutritionist) {
      const { error } = await supabase
        .from('nutritionists' as any)
        .update(payload)
        .eq('id', selectedNutritionist.id);

      if (error) {
        toast.error('Error al actualizar nutricionista');
        return;
      }
      toast.success('Nutricionista actualizado');
    } else {
      const { error } = await supabase
        .from('nutritionists' as any)
        .insert(payload);

      if (error) {
        toast.error('Error al crear nutricionista: ' + error.message);
        return;
      }
      toast.success('Nutricionista creado');
    }

    setDialogOpen(false);
    resetForm();
    loadNutritionists();
  }

  async function handleDeleteNutritionist(id: string) {
    if (!confirm('¿Eliminar este nutricionista?')) return;

    const { error } = await supabase
      .from('nutritionists' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar');
      return;
    }

    toast.success('Nutricionista eliminado');
    loadNutritionists();
  }

  async function handleAddSlot() {
    if (!selectedNutritionist || !slotForm.date) {
      toast.error('Completa todos los campos');
      return;
    }

    const { error } = await supabase
      .from('appointment_slots' as any)
      .insert({
        nutritionist_id: selectedNutritionist.id,
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        is_available: true,
      });

    if (error) {
      toast.error('Error al crear slot');
      return;
    }

    toast.success('Horario agregado');
    loadSlots(selectedNutritionist.id);
    setSlotForm({ date: '', start_time: '09:00', end_time: '10:00' });
  }

  async function handleDeleteSlot(slotId: string) {
    const { error } = await supabase
      .from('appointment_slots' as any)
      .delete()
      .eq('id', slotId);

    if (error) {
      toast.error('Error al eliminar slot');
      return;
    }

    toast.success('Horario eliminado');
    if (selectedNutritionist) {
      loadSlots(selectedNutritionist.id);
    }
  }

  async function handleUpdateAppointmentStatus(appointmentId: string, status: string) {
    const { error } = await supabase
      .from('appointments' as any)
      .update({ status })
      .eq('id', appointmentId);

    if (error) {
      toast.error('Error al actualizar estado');
      return;
    }

    toast.success('Estado actualizado');
    loadAppointments();
    setAppointmentDetailsOpen(false);
  }

  function resetForm() {
    setFormData({
      user_id: '',
      specialization: [],
      bio: '',
      price_per_session: 1500,
      consultation_duration: 60,
      is_active: true,
    });
    setSelectedNutritionist(null);
  }

  function openEditDialog(nutritionist: Nutritionist) {
    setSelectedNutritionist(nutritionist);
    setFormData({
      user_id: nutritionist.user_id,
      specialization: nutritionist.specialization,
      bio: nutritionist.bio || '',
      price_per_session: nutritionist.price_per_session,
      consultation_duration: nutritionist.consultation_duration,
      is_active: nutritionist.is_active,
    });
    setDialogOpen(true);
  }

  function openSlotsDialog(nutritionist: Nutritionist) {
    setSelectedNutritionist(nutritionist);
    loadSlots(nutritionist.id);
    setSlotsDialogOpen(true);
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <Layout>
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-3xl font-bold">Nutricionistas</h1>
              <p className="text-muted-foreground">Gestión de citas y nutricionistas</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Nutricionista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedNutritionist ? 'Editar Nutricionista' : 'Nuevo Nutricionista'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Usuario</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, user_id: v }))}
                    disabled={!!selectedNutritionist}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Especializaciones</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SPECIALIZATIONS.map((spec) => (
                      <Badge
                        key={spec}
                        variant={formData.specialization.includes(spec) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            specialization: prev.specialization.includes(spec)
                              ? prev.specialization.filter(s => s !== spec)
                              : [...prev.specialization, spec]
                          }));
                        }}
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Descripción del nutricionista..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio por sesión (RD$)</Label>
                    <Input
                      type="number"
                      value={formData.price_per_session}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_per_session: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Duración (min)</Label>
                    <Input
                      type="number"
                      value={formData.consultation_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, consultation_duration: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Activo</Label>
                </div>

                <Button onClick={handleSaveNutritionist} className="w-full">
                  {selectedNutritionist ? 'Actualizar' : 'Crear'} Nutricionista
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{nutritionists.length}</p>
                  <p className="text-sm text-muted-foreground">Nutricionistas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                  <p className="text-sm text-muted-foreground">Citas Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {appointments.filter(a => a.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Star className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {appointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="nutritionists">
          <TabsList className="mb-4">
            <TabsTrigger value="nutritionists">Nutricionistas</TabsTrigger>
            <TabsTrigger value="appointments">Citas</TabsTrigger>
          </TabsList>

          {/* Nutritionists Tab */}
          <TabsContent value="nutritionists">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto" />
                </CardContent>
              </Card>
            ) : nutritionists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay nutricionistas registrados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nutritionists.map((nutritionist) => (
                  <Card key={nutritionist.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {nutritionist.profiles?.full_name || 'Sin nombre'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {nutritionist.profiles?.email}
                          </p>
                        </div>
                        <Badge variant={nutritionist.is_active ? 'default' : 'secondary'}>
                          {nutritionist.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {nutritionist.specialization.map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>{nutritionist.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {nutritionist.total_consultations} consultas
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {nutritionist.consultation_duration} min
                        </span>
                        <span className="font-semibold">
                          RD${nutritionist.price_per_session.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openSlotsDialog(nutritionist)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Horarios
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(nutritionist)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteNutritionist(nutritionist.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {(appointment as any).profiles?.full_name || 'Sin nombre'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(appointment as any).profiles?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {appointment.consultation_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell>RD${appointment.total_price.toFixed(2)}</TableCell>
                        <TableCell>
                          {format(new Date(appointment.created_at), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setAppointmentDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Slots Dialog */}
        <Dialog open={slotsDialogOpen} onOpenChange={setSlotsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Horarios - {selectedNutritionist?.profiles?.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Add Slot Form */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={slotForm.date}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Inicio</Label>
                  <Input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleAddSlot} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Horario
              </Button>

              {/* Slots List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay horarios configurados
                  </p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(slot.date), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span className="text-muted-foreground">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <Badge variant={slot.is_available ? 'default' : 'secondary'}>
                          {slot.is_available ? 'Disponible' : 'Ocupado'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointment Details Dialog */}
        <Dialog open={appointmentDetailsOpen} onOpenChange={setAppointmentDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalles de la Cita</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="font-medium">
                      {(selectedAppointment as any).profiles?.full_name || 'Sin nombre'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Datos del Cliente</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg space-y-1">
                    {Object.entries(selectedAppointment.client_data || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Cambiar Estado</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedAppointment.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, status)}
                      >
                        {status === 'pending' && 'Pendiente'}
                        {status === 'confirmed' && 'Confirmar'}
                        {status === 'completed' && 'Completar'}
                        {status === 'cancelled' && 'Cancelar'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
