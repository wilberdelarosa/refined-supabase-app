import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntakeResponse {
  questions: Array<{
    id: string;
    question: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    options?: string[];
    required: boolean;
  }>;
  summary?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, currentAnswers, stage } = await req.json();

    console.log('AI Intake request:', { goal, stage, answersCount: Object.keys(currentAnswers || {}).length });

    // Use AI Gateway for Lovable AI
    const aiGatewayUrl = Deno.env.get('AI_GATEWAY_URL') || 'https://ai.lovable.dev/v1';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Eres un asistente de nutrición deportiva experto que ayuda a recopilar información del cliente antes de una consulta con un nutricionista.

Tu objetivo es hacer preguntas relevantes y personalizadas para entender mejor al cliente y sus necesidades.

REGLAS:
1. Haz preguntas específicas y relevantes según el objetivo del cliente
2. Sé amable y profesional
3. Las preguntas deben ser claras y fáciles de responder
4. Genera entre 3-5 preguntas por etapa
5. Responde SOLO en formato JSON válido

Tipos de preguntas disponibles:
- "text": para respuestas cortas
- "number": para valores numéricos
- "select": para opciones múltiples (incluye array "options")
- "textarea": para respuestas largas

Formato de respuesta JSON:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "La pregunta aquí",
      "type": "text|number|select|textarea",
      "options": ["opción1", "opción2"] // solo para type "select"
      "required": true
    }
  ],
  "summary": "Resumen breve de lo recopilado hasta ahora (solo si hay respuestas previas)"
}`;

    const userPrompt = `
Objetivo del cliente: ${goal || 'No especificado'}

${currentAnswers && Object.keys(currentAnswers).length > 0 
  ? `Respuestas previas:
${Object.entries(currentAnswers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
  : 'Esta es la primera etapa, no hay respuestas previas.'}

Etapa actual: ${stage || 'inicial'}

Genera las siguientes preguntas relevantes para esta consulta nutricional.
${stage === 'inicial' 
  ? 'Enfócate en: información básica (edad, peso, altura, nivel de actividad física)'
  : stage === 'historial' 
    ? 'Enfócate en: historial médico, alergias, condiciones, medicamentos'
    : stage === 'objetivos'
      ? 'Enfócate en: objetivos específicos, experiencia con suplementos, rutina actual'
      : 'Haz preguntas de seguimiento basadas en las respuestas anteriores'}`;

    const response = await fetch(`${aiGatewayUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Return default questions if AI fails
      return new Response(
        JSON.stringify({
          questions: [
            { id: 'age', question: '¿Cuál es tu edad?', type: 'number', required: true },
            { id: 'weight', question: '¿Cuál es tu peso actual (kg)?', type: 'number', required: true },
            { id: 'height', question: '¿Cuál es tu altura (cm)?', type: 'number', required: true },
            { id: 'activity_level', question: '¿Cuál es tu nivel de actividad física?', type: 'select', options: ['Sedentario', 'Ligero (1-2 días/semana)', 'Moderado (3-4 días/semana)', 'Activo (5-6 días/semana)', 'Muy activo (diario)'], required: true },
            { id: 'goal_detail', question: '¿Cuál es tu objetivo principal?', type: 'select', options: ['Pérdida de peso', 'Ganancia muscular', 'Rendimiento deportivo', 'Salud general', 'Otro'], required: true },
          ],
          summary: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    console.log('AI Response:', content);

    // Parse JSON from response
    let parsedResponse: IntakeResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return default questions
      parsedResponse = {
        questions: [
          { id: 'age', question: '¿Cuál es tu edad?', type: 'number', required: true },
          { id: 'weight', question: '¿Cuál es tu peso actual (kg)?', type: 'number', required: true },
          { id: 'height', question: '¿Cuál es tu altura (cm)?', type: 'number', required: true },
          { id: 'activity_level', question: '¿Cuál es tu nivel de actividad física?', type: 'select', options: ['Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy activo'], required: true },
        ],
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI consultation intake:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error generating questions',
        questions: [
          { id: 'notes', question: '¿Cuéntanos sobre tus objetivos de salud y fitness?', type: 'textarea', required: true },
        ]
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
