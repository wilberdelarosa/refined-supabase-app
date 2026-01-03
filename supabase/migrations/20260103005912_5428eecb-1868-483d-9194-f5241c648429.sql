-- =====================================================
-- TABLAS ADICIONALES PARA MICROSERVICIO DE CITAS
-- =====================================================

-- Tabla de formularios dinámicos
CREATE TABLE IF NOT EXISTS public.dynamic_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    form_type TEXT NOT NULL DEFAULT 'pre_consultation',
    nutritionist_id UUID REFERENCES public.nutritionists(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de notas de consulta
CREATE TABLE IF NOT EXISTS public.appointment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]',
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS public.appointment_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointment_notes_appointment ON public.appointment_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reviews_nutritionist ON public.appointment_reviews(nutritionist_id);

-- Enable RLS
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reviews ENABLE ROW LEVEL SECURITY;

-- RLS para dynamic_forms
CREATE POLICY "Anyone can view active forms"
ON public.dynamic_forms FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage forms"
ON public.dynamic_forms FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- RLS para appointment_notes
CREATE POLICY "Users can view their appointment notes"
ON public.appointment_notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_notes.appointment_id 
        AND client_id = auth.uid()
    )
    AND is_private = false
);

CREATE POLICY "Nutritionists can manage notes for their appointments"
ON public.appointment_notes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.nutritionists n ON n.id = a.nutritionist_id
        WHERE a.id = appointment_notes.appointment_id 
        AND n.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.nutritionists n ON n.id = a.nutritionist_id
        WHERE a.id = appointment_notes.appointment_id 
        AND n.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all notes"
ON public.appointment_notes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- RLS para appointment_reviews
CREATE POLICY "Anyone can view reviews"
ON public.appointment_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their appointments"
ON public.appointment_reviews FOR INSERT
WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_reviews.appointment_id 
        AND client_id = auth.uid()
        AND status = 'completed'
    )
);

CREATE POLICY "Admins can manage all reviews"
ON public.appointment_reviews FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_dynamic_forms_updated_at
    BEFORE UPDATE ON public.dynamic_forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_notes_updated_at
    BEFORE UPDATE ON public.appointment_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();