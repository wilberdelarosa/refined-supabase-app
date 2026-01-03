import { useState, useEffect } from 'react';
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

const STAGES = ['inicial', 'historial', 'objetivos'];
const STAGE_LABELS: Record<string, string> = {
  inicial: 'Información Básica',
  historial: 'Historial de Salud',
  objetivos: 'Objetivos y Preferencias',
};

export function AIIntakeForm({ goal, onComplete, onBack }: AIIntakeFormProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [currentStage]);

  async function loadQuestions() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-consultation-intake', {
        body: {
          goal,
          currentAnswers: answers,
          stage: STAGES[currentStage],
        },
      });

      if (error) throw error;

      setQuestions(data.questions || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error loading AI questions:', err);
      // Fallback questions
      setQuestions([
        { id: 'age', question: '¿Cuál es tu edad?', type: 'number', required: true },
        { id: 'weight', question: '¿Cuál es tu peso (kg)?', type: 'number', required: true },
        { id: 'notes', question: '¿Algo más que quieras compartir?', type: 'textarea', required: false },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(questionId: string, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  }

  function handlePrevious() {
    if (currentStage > 0) {
      setCurrentStage(prev => prev - 1);
    } else {
      onBack();
    }
  }

  const isStageComplete = questions.every(q => !q.required || answers[q.id]);

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
        
        {/* Progress */}
        <div className="flex gap-2 mt-4">
          {STAGES.map((stage, idx) => (
            <div key={stage} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  idx <= currentStage ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <p className={`text-xs mt-1 ${idx === currentStage ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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
                  transition={{ delay: idx * 0.1 }}
                >
                  <Label htmlFor={q.id} className="flex items-center gap-1">
                    {q.question}
                    {q.required && <span className="text-destructive">*</span>}
                  </Label>
                  
                  {q.type === 'text' && (
                    <Input
                      id={q.id}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="mt-1"
                    />
                  )}
                  
                  {q.type === 'number' && (
                    <Input
                      id={q.id}
                      type="number"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="mt-1"
                    />
                  )}
                  
                  {q.type === 'textarea' && (
                    <Textarea
                      id={q.id}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  )}
                  
                  {q.type === 'select' && q.options && (
                    <Select
                      value={answers[q.id] || ''}
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

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handlePrevious} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStageComplete || loading}
            className="flex-1"
          >
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
