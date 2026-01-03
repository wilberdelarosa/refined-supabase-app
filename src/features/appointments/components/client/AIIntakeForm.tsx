import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required: boolean;
}

interface AIIntakeFormProps {
  goal: string;
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

const STAGES = ['inicial', 'historial', 'objetivos'] as const;
const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  inicial: 'Información Básica',
  historial: 'Historial de Salud',
  objetivos: 'Objetivos y Preferencias',
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function withStageId(stage: (typeof STAGES)[number], q: Question): Question {
  // Evita colisiones entre etapas (p.ej. "age" repetida en varias etapas)
  return { ...q, id: `${stage}.${q.id}` };
}

function defaultQuestionsForStage(stage: (typeof STAGES)[number]): Question[] {
  // Base robusta: asegura info mínima aunque la IA repita o falle.
  if (stage === 'inicial') {
    return [
      { id: 'age', question: '¿Cuál es tu edad?', type: 'number', required: true },
      {
        id: 'sex',
        question: '¿Cuál es tu sexo?',
        type: 'select',
        options: ['Masculino', 'Femenino', 'Prefiero no decir'],
        required: true,
      },
      { id: 'weight', question: '¿Cuál es tu peso actual (kg)?', type: 'number', required: true },
      { id: 'height', question: '¿Cuál es tu altura (cm)?', type: 'number', required: true },
      {
        id: 'activity_level',
        question: '¿Cuál es tu nivel de actividad física?',
        type: 'select',
        options: ['Sedentario', 'Ligero (1-2 días/semana)', 'Moderado (3-4 días/semana)', 'Activo (5-6 días/semana)', 'Muy activo (diario)'],
        required: true,
      },
    ];
  }

  if (stage === 'historial') {
    return [
      { id: 'medical_conditions', question: '¿Tienes alguna condición médica relevante (diagnosticada)?', type: 'textarea', required: false },
      { id: 'medications', question: '¿Tomas medicamentos actualmente? (cuáles y dosis si aplica)', type: 'textarea', required: false },
      { id: 'allergies', question: '¿Alergias o intolerancias alimentarias?', type: 'textarea', required: false },
      { id: 'injuries', question: '¿Lesiones recientes o dolor recurrente al entrenar?', type: 'textarea', required: false },
    ];
  }

  return [
    { id: 'training_routine', question: 'Describe tu rutina de entrenamiento actual (días/semana, tipo, duración).', type: 'textarea', required: true },
    { id: 'diet', question: '¿Cómo es tu alimentación típica en un día normal?', type: 'textarea', required: true },
    { id: 'supplements_current', question: '¿Qué suplementos consumes actualmente? (marca, dosis y horario)', type: 'textarea', required: false },
    { id: 'constraints', question: '¿Tienes restricciones (presupuesto, tiempo, preferencia vegana, etc.)?', type: 'textarea', required: false },
    { id: 'notes', question: '¿Algo más que quieras que el nutricionista sepa?', type: 'textarea', required: false },
  ];
}

export function AIIntakeForm({ goal, onComplete, onBack }: AIIntakeFormProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);

  // Para evitar preguntas repetidas entre recargas/etapas
  const [askedSignatures, setAskedSignatures] = useState<Set<string>>(new Set());

  const stageKey = STAGES[currentStage];

  useEffect(() => {
    // Si cambia el objetivo, reiniciamos el flujo para evitar reusar estado viejo.
    setCurrentStage(0);
    setQuestions([]);
    setAnswers({});
    setSummary(null);
    setAskedSignatures(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);

  const stageDefaults = useMemo(() => defaultQuestionsForStage(stageKey), [stageKey]);

  async function loadQuestions() {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-consultation-intake', {
        body: {
          goal,
          currentAnswers: answers,
          stage: stageKey,
        },
      });

      if (error) throw error;

      const raw: Question[] = Array.isArray(data?.questions) ? data.questions : [];
      const aiQuestions = raw.map((q) => withStageId(stageKey, q));

      // Filtra duplicados (por id y por texto) y fusiona con base fija.
      const nextAsked = new Set(askedSignatures);
      const deduped: Question[] = [];

      const consider = (q: Question) => {
        const signature = `${q.id}::${normalizeText(q.question)}`;
        const textSig = normalizeText(q.question);
        if (nextAsked.has(signature) || nextAsked.has(`text::${textSig}`)) return;
        nextAsked.add(signature);
        nextAsked.add(`text::${textSig}`);
        deduped.push(q);
      };

      aiQuestions.forEach(consider);
      stageDefaults.map((q) => withStageId(stageKey, q)).forEach(consider);

      setAskedSignatures(nextAsked);
      setQuestions(deduped);

      if (data?.summary) setSummary(data.summary);
    } catch (err) {
      console.error('Error loading AI questions:', err);
      // Fallback robusto por etapa
      setQuestions(stageDefaults.map((q) => withStageId(stageKey, q)));
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(questionId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (currentStage < STAGES.length - 1) {
      setCurrentStage((prev) => prev + 1);
    } else {
      onComplete(answers);
    }
  }

  function handlePrevious() {
    if (currentStage > 0) {
      setCurrentStage((prev) => prev - 1);
    } else {
      onBack();
    }
  }

  const isStageComplete = questions.every((q) => !q.required || Boolean(answers[q.id]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cuestionario Inteligente</CardTitle>
          </div>
          <Badge variant="outline">
            {currentStage + 1} de {STAGES.length}
          </Badge>
        </div>

        <div className="flex gap-2 mt-4">
          {STAGES.map((stage, idx) => (
            <div key={stage} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  idx <= currentStage ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <p
                className={`text-xs mt-1 ${
                  idx === currentStage ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {STAGE_LABELS[stage]}
              </p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {summary && (
          <div className="p-3 bg-primary/5 rounded-lg text-sm">
            <p className="text-muted-foreground">{summary}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generando preguntas personalizadas...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {questions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Label htmlFor={q.id} className="flex items-center gap-1">
                    {q.question}
                    {q.required && <span className="text-destructive">*</span>}
                  </Label>

                  {q.type === 'text' && (
                    <Input
                      id={q.id}
                      value={answers[q.id] ?? ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="mt-1"
                    />
                  )}

                  {q.type === 'number' && (
                    <Input
                      id={q.id}
                      type="number"
                      value={answers[q.id] ?? ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="mt-1"
                    />
                  )}

                  {q.type === 'textarea' && (
                    <Textarea
                      id={q.id}
                      value={answers[q.id] ?? ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  )}

                  {q.type === 'select' && q.options && (
                    <Select
                      value={answers[q.id] ?? ''}
                      onValueChange={(value) => handleAnswerChange(q.id, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {q.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handlePrevious} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button onClick={handleNext} disabled={!isStageComplete || loading} className="flex-1">
            {currentStage < STAGES.length - 1 ? (
              <>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              'Completar'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
