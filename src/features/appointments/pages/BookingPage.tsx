import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Sparkles, CheckCircle } from 'lucide-react';
import { appointmentsAPI, Nutritionist } from '@/features/appointments/api';
import { useAppointmentSlots } from '@/features/appointments/hooks/useAppointments';
import { AIIntakeForm } from '@/features/appointments/components/client/AIIntakeForm';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type BookingStep = 'goal' | 'intake' | 'schedule' | 'confirm';

const GOALS = [
  { id: 'weight_loss', label: 'Pérdida de peso', icon: '🏃' },
  { id: 'muscle_gain', label: 'Ganancia muscular', icon: '💪' },
  { id: 'sports_performance', label: 'Rendimiento deportivo', icon: '🏆' },
  { id: 'general_health', label: 'Salud general', icon: '❤️' },
  { id: 'supplementation', label: 'Asesoría en suplementación', icon: '💊' },
];

export default function BookingPage() {
  const { nutritionistId } = useParams<{ nutritionistId: string }>();
  const navigate = useNavigate();

  const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null);
  const [step, setStep] = useState<BookingStep>('goal');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
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

  async function handleSubmit() {
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
        clientData: {
          goal: selectedGoal,
          ...intakeAnswers,
        },
      });

      toast.success('¡Cita agendada exitosamente!', {
        description: 'Recibirás un correo de confirmación',
      });
      navigate('/account/appointments');
    } catch (error) {
      toast.error('Error al agendar cita. ¿Estás autenticado?');
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
            <h1 className="font-display text-2xl font-bold">Agendar Consulta</h1>
            <p className="text-muted-foreground">
              con {nutritionist.full_name}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { id: 'goal', label: 'Objetivo' },
            { id: 'intake', label: 'Cuestionario' },
            { id: 'schedule', label: 'Horario' },
            { id: 'confirm', label: 'Confirmar' },
          ].map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s.id
                    ? 'bg-primary text-primary-foreground'
                    : ['goal', 'intake', 'schedule', 'confirm'].indexOf(step) > idx
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {['goal', 'intake', 'schedule', 'confirm'].indexOf(step) > idx ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    ['goal', 'intake', 'schedule', 'confirm'].indexOf(step) > idx
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Nutritionist Info */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{nutritionist.full_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">⭐ {nutritionist.rating.toFixed(1)}</Badge>
                    <span>{nutritionist.consultation_duration} min</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">RD${nutritionist.price_per_session.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">por sesión</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Goal Selection */}
          {step === 'goal' && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    ¿Cuál es tu objetivo principal?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedGoal === goal.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl mr-3">{goal.icon}</span>
                      <span className="font-medium">{goal.label}</span>
                    </button>
                  ))}
                  <Button
                    onClick={() => setStep('intake')}
                    disabled={!selectedGoal}
                    className="w-full mt-4"
                  >
                    Continuar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: AI Intake Form */}
          {step === 'intake' && (
            <motion.div
              key="intake"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AIIntakeForm
                goal={GOALS.find(g => g.id === selectedGoal)?.label || selectedGoal}
                onComplete={(answers) => {
                  setIntakeAnswers(answers);
                  setStep('schedule');
                }}
                onBack={() => setStep('goal')}
              />
            </motion.div>
          )}

          {/* Step 3: Schedule */}
          {step === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Selecciona Fecha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </CardContent>
              </Card>

              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Selecciona Horario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {slotsLoading ? (
                      <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay horarios disponibles para esta fecha
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <Button
                            key={slot.id}
                            type="button"
                            variant={selectedSlot === slot.id ? 'default' : 'outline'}
                            onClick={() => setSelectedSlot(slot.id)}
                          >
                            {slot.start_time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('intake')} className="flex-1">
                  Anterior
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedSlot}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Confirmar Cita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nutricionista:</span>
                      <span className="font-medium">{nutritionist.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objetivo:</span>
                      <span className="font-medium">
                        {GOALS.find(g => g.id === selectedGoal)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horario:</span>
                      <span className="font-medium">
                        {slots.find(s => s.id === selectedSlot)?.start_time}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        RD${nutritionist.price_per_session.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {Object.keys(intakeAnswers).length > 0 && (
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium mb-2">Información proporcionada:</p>
                      <div className="text-sm space-y-1">
                        {Object.entries(intakeAnswers).slice(0, 5).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(intakeAnswers).length > 5 && (
                          <p className="text-muted-foreground">
                            +{Object.keys(intakeAnswers).length - 5} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('schedule')}
                      className="flex-1"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={booking}
                      className="flex-1"
                    >
                      {booking ? 'Agendando...' : 'Confirmar Cita'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
