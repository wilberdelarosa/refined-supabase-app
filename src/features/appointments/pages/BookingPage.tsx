import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { appointmentsAPI, Nutritionist } from '@/features/appointments/api';
import { useAppointmentSlots } from '@/features/appointments/hooks/useAppointments';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function BookingPage() {
    const { nutritionistId } = useParams<{ nutritionistId: string }>();
    const navigate = useNavigate();

    const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [formData, setFormData] = useState({
        age: '',
        weight: '',
        goal: '',
        notes: '',
    });
    const [booking, setBooking] = useState(false);

    const { slots, loading: slotsLoading } = useAppointmentSlots(
        nutritionistId || null,
        selectedDate
    );

    useEffect(() => {
        if (nutritionistId) {
            loadNutritionist();
        }
    }, [nutritionistId]);

    async function loadNutritionist() {
        try {
            const data = await appointmentsAPI.getNutritionist(nutritionistId!);
            setNutritionist(data);
        } catch (error) {
            toast.error('Error al cargar nutricionista');
            navigate('/appointments');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedSlot) {
            toast.error('Selecciona un horario');
            return;
        }

        try {
            setBooking(true);
            await appointmentsAPI.createAppointment({
                nutritionistId: nutritionistId!,
                slotId: selectedSlot,
                consultationType: 'pre_purchase',
                clientData: formData,
            });

            toast.success('¡Cita agendada exitosamente!', {
                description: 'Recibirás un correo de confirmación',
            });
            navigate('/account/appointments');
        } catch (error) {
            toast.error('Error al agendar cita');
        } finally {
            setBooking(false);
        }
    }

    if (!nutritionist) {
        return (
            <Layout>
                <div className="container py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/appointments">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-display text-2xl font-bold">Agendar Cita</h1>
                        <p className="text-muted-foreground">
                            con {nutritionist.full_name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nutritionist Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Nutricionista Seleccionado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{nutritionist.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{nutritionist.email}</p>
                                </div>
                                <Badge variant="secondary">
                                    ⭐ {nutritionist.rating.toFixed(1)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{nutritionist.consultation_duration} min</span>
                                </div>
                                <div className="font-semibold text-foreground">
                                    RD${nutritionist.price_per_session.toFixed(2)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Selecciona Fecha
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </CardContent>
                    </Card>

                    {/* Time Slot Selection */}
                    {selectedDate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Selecciona Horario
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {slotsLoading ? (
                                    <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                                ) : slots.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No hay horarios disponibles para esta fecha</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {slots.map((slot) => (
                                            <Button
                                                key={slot.id}
                                                type="button"
                                                variant={selectedSlot === slot.id ? 'default' : 'outline'}
                                                onClick={() => setSelectedSlot(slot.id)}
                                                className="justify-center"
                                            >
                                                {slot.start_time}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Client Info Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="age">Edad</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="weight">Peso (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="goal">Objetivo Principal</Label>
                                <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona tu objetivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weight_loss">Pérdida de peso</SelectItem>
                                        <SelectItem value="muscle_gain">Ganancia muscular</SelectItem>
                                        <SelectItem value="sports_performance">Rendimiento deportivo</SelectItem>
                                        <SelectItem value="general_health">Salud general</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Alergias, condiciones médicas, etc."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate('/appointments')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={booking || !selectedSlot}
                        >
                            {booking ? 'Agendando...' : 'Confirmar Cita'}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
