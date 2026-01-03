/**
 * APPOINTMENTS API CLIENT
 * Wrapper desacoplado para el microservicio de citas
 * Usa `as any` para evitar errores de tipos antes de aplicar migración SQL
 */

import { supabase } from '@/integrations/supabase/client';
import { APPOINTMENTS_CONFIG } from './config';

// ============================================
// TYPES
// ============================================

export interface Nutritionist {
    id: string;
    user_id: string;
    specialization: string[];
    bio: string | null;
    price_per_session: number;
    consultation_duration: number;
    rating: number;
    total_consultations: number;
    is_active: boolean;
    full_name?: string;
    email?: string;
}

export interface AppointmentSlot {
    id: string;
    nutritionist_id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

export interface Appointment {
    id: string;
    client_id: string;
    nutritionist_id: string;
    slot_id: string;
    consultation_type: 'pre_purchase' | 'post_purchase' | 'follow_up';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    client_data: Record<string, any>;
    total_price: number;
    paid: boolean;
    created_at: string;
}

export interface Quote {
    id: string;
    client_id: string;
    nutritionist_id: string;
    services: Array<{
        name: string;
        description?: string;
        price: number;
        quantity: number;
    }>;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    valid_until: string;
}

// ============================================
// API CLIENT
// ============================================

class AppointmentsAPI {
    private enabled: boolean;

    constructor() {
        this.enabled = APPOINTMENTS_CONFIG.ENABLED;
    }

    private checkEnabled() {
        if (!this.enabled) {
            throw new Error('Appointments microservice is disabled');
        }
    }

    async getNutritionists(): Promise<Nutritionist[]> {
        this.checkEnabled();
        const { data, error } = await supabase
            .from('nutritionists' as any)
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false });

        if (error) throw error;
        return (data || []) as Nutritionist[];
    }

    async getNutritionist(id: string): Promise<Nutritionist | null> {
        this.checkEnabled();
        const { data, error } = await supabase
            .from('nutritionists' as any)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Nutritionist;
    }

    async getAvailableSlots(nutritionistId: string, dateFrom?: string): Promise<AppointmentSlot[]> {
        this.checkEnabled();
        let query = supabase
            .from('appointment_slots' as any)
            .select('*')
            .eq('nutritionist_id', nutritionistId)
            .eq('is_available', true)
            .order('date')
            .order('start_time');

        if (dateFrom) {
            query = query.gte('date', dateFrom);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as AppointmentSlot[];
    }

    async createAppointment(appointmentData: {
        nutritionistId: string;
        slotId: string;
        consultationType: Appointment['consultation_type'];
        clientData: Record<string, any>;
    }): Promise<Appointment> {
        this.checkEnabled();
        const nutritionist = await this.getNutritionist(appointmentData.nutritionistId);
        if (!nutritionist) throw new Error('Nutritionist not found');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('appointments' as any)
            .insert({
                nutritionist_id: appointmentData.nutritionistId,
                slot_id: appointmentData.slotId,
                consultation_type: appointmentData.consultationType,
                client_data: appointmentData.clientData,
                total_price: nutritionist.price_per_session,
                client_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    }

    async getMyAppointments(): Promise<Appointment[]> {
        this.checkEnabled();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('appointments' as any)
            .select('*')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Appointment[];
    }

    async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
        this.checkEnabled();
        const { error } = await supabase
            .from('appointments' as any)
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason,
            })
            .eq('id', appointmentId);

        if (error) throw error;
    }

    async getQuote(id: string): Promise<Quote | null> {
        this.checkEnabled();
        const { data, error } = await supabase
            .from('quotes' as any)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Quote;
    }

    async acceptQuote(id: string): Promise<void> {
        this.checkEnabled();
        const { error } = await supabase
            .from('quotes' as any)
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    }
}

export const appointmentsAPI = new AppointmentsAPI();
