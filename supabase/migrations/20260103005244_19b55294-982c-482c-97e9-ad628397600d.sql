-- =====================================================
-- MICROSERVICIO DE CITAS CON NUTRICIONISTAS
-- =====================================================

-- Tabla de nutricionistas (referencia profiles existentes)
CREATE TABLE IF NOT EXISTS public.nutritionists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    specialization TEXT[] DEFAULT ARRAY['Nutrición deportiva'],
    bio TEXT,
    price_per_session NUMERIC NOT NULL DEFAULT 1500,
    consultation_duration INTEGER NOT NULL DEFAULT 60,
    rating NUMERIC DEFAULT 5.0,
    total_consultations INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Tabla de horarios disponibles
CREATE TABLE IF NOT EXISTS public.appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id),
    slot_id UUID REFERENCES public.appointment_slots(id),
    consultation_type TEXT NOT NULL DEFAULT 'pre_purchase',
    status TEXT NOT NULL DEFAULT 'pending',
    client_data JSONB DEFAULT '{}',
    total_price NUMERIC NOT NULL DEFAULT 0,
    paid BOOLEAN DEFAULT false,
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de cotizaciones (opcional)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionists(id),
    services JSONB NOT NULL DEFAULT '[]',
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    valid_until TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_appointment_slots_nutritionist_date ON public.appointment_slots(nutritionist_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist ON public.appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Enable RLS
ALTER TABLE public.nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para nutritionists
CREATE POLICY "Anyone can view active nutritionists"
ON public.nutritionists FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage nutritionists"
ON public.nutritionists FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies para appointment_slots
CREATE POLICY "Anyone can view available slots"
ON public.appointment_slots FOR SELECT
USING (is_available = true);

CREATE POLICY "Nutritionists can manage their slots"
ON public.appointment_slots FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointment_slots.nutritionist_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointment_slots.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all slots"
ON public.appointment_slots FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies para appointments
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Nutritionists can view their appointments"
ON public.appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointments.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Nutritionists can update their appointments"
ON public.appointments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = appointments.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies para quotes
CREATE POLICY "Users can view their own quotes"
ON public.quotes FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Users can update their own quotes"
ON public.quotes FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Nutritionists can manage quotes"
ON public.quotes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = quotes.nutritionist_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.nutritionists 
        WHERE id = quotes.nutritionist_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all quotes"
ON public.quotes FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_nutritionists_updated_at
    BEFORE UPDATE ON public.nutritionists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();