/**
 * APPOINTMENTS API CLIENT
 * 
 * Wrapper para todas las llamadas API del microservicio
 * Aislado del resto de la aplicación
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
    // Datos del perfil
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
// API CLIENT CLASS
// ============================================

class AppointmentsAPI {
    private enabled: boolean;

    constructor() {
        this.enabled = APPOINTMENTS_CONFIG.ENABLED;
    }

    /**
     * Verificar si el servicio está habilitado
     */
    private checkEnabled() {
        if (!this.enabled) {
            throw new Error('Appointments microservice is disabled');
        }
    }

    // ==================== NUTRITIONISTS ====================

    /**
     * Obtener lista de nutricionistas
     */
    async getNutritionists(filters?: {
        specialization?: string;
        minRating?: number;
    }): Promise<Nutritionist[]> {
        this.checkEnabled();

        let query = supabase
            .from('nutritionists')
            .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
            .eq('is_active', true)
            .order('rating', { ascending: false });

        if (filters?.minRating) {
            query = query.gte('rating', filters.minRating);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.map(n => ({
            ...n,
            full_name: n.profiles?.full_name,
            email: n.profiles?.email,
        }));
    }

    /**
     * Obtener un nutricionista por ID
     */
    async getNutritionist(id: string): Promise<Nutritionist | null> {
        this.checkEnabled();

        const { data, error } = await supabase
            .from('nutritionists')
            .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) return null;

        return {
            ...data,
            full_name: data.profiles?.full_name,
            email: data.profiles?.email,
        };
    }

    // ==================== SLOTS ====================

    /**
     * Obtener slots disponibles
     */
    async getAvailableSlots(
        nutritionistId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<AppointmentSlot[]> {
        this.checkEnabled();

        let query = supabase
            .from('appointment_slots')
            .select('*')
            .eq('nutritionist_id', nutritionistId)
            .eq('is_available', true)
            .order('date')
            .order('start_time');

        if (dateFrom) {
            query = query.gte('date', dateFrom);
        }

        if (dateTo) {
            query = query.lte('date', dateTo);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    // ==================== APPOINTMENTS ====================

    /**
     * Crear una cita
     */
    async createAppointment(data: {
        nutritionistId: string;
        slotId: string;
        consultationType: Appointment['consultation_type'];
        clientData: Record<string, any>;
    }): Promise<Appointment> {
        this.checkEnabled();

        // Obtener precio del nutricionista
        const nutritionist = await this.getNutritionist(data.nutritionistId);
        if (!nutritionist) throw new Error('Nutritionist not found');

        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
                nutritionist_id: data.nutritionistId,
                slot_id: data.slotId,
                consultation_type: data.consultationType,
                client_data: data.clientData,
                total_price: nutritionist.price_per_session,
                client_id: (await supabase.auth.getUser()).data.user?.id,
            })
            .select()
            .single();

        if (error) throw error;
        return appointment;
    }

    /**
     * Obtener mis citas
     */
    async getMyAppointments(): Promise<Appointment[]> {
        this.checkEnabled();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Cancelar cita
     */
    async cancelAppointment(
        appointmentId: string,
        reason?: string
    ): Promise<void> {
        this.checkEnabled();

        const { error } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: reason,
            })
            .eq('id', appointmentId);

        if (error) throw error;
    }

    // ==================== QUOTES ====================

    /**
     * Obtener cotización
     */
    async getQuote(id: string): Promise<Quote | null> {
        this.checkEnabled();

        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Aceptar cotización
     */
    async acceptQuote(id: string): Promise<void> {
        this.checkEnabled();

        const { error } = await supabase
            .from('quotes')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const appointmentsAPI = new AppointmentsAPI();
