/**
 * CUSTOM HOOKS - APPOINTMENTS
 */

import { useState, useEffect } from 'react';
import { appointmentsAPI, Nutritionist, AppointmentSlot, Appointment } from '../api';

export function useNutritionists() {
    const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadNutritionists();
    }, []);

    async function loadNutritionists() {
        try {
            setLoading(true);
            const data = await appointmentsAPI.getNutritionists();
            setNutritionists(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading nutritionists');
        } finally {
            setLoading(false);
        }
    }

    return { nutritionists, loading, error, reload: loadNutritionists };
}

export function useAppointmentSlots(nutritionistId: string | null, date?: string) {
    const [slots, setSlots] = useState<AppointmentSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!nutritionistId) {
            setSlots([]);
            return;
        }

        loadSlots();
    }, [nutritionistId, date]);

    async function loadSlots() {
        if (!nutritionistId) return;

        try {
            setLoading(true);
            const data = await appointmentsAPI.getAvailableSlots(nutritionistId, date);
            setSlots(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading slots');
        } finally {
            setLoading(false);
        }
    }

    return { slots, loading, error, reload: loadSlots };
}

export function useMyAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAppointments();
    }, []);

    async function loadAppointments() {
        try {
            setLoading(true);
            const data = await appointmentsAPI.getMyAppointments();
            setAppointments(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading appointments');
        } finally {
            setLoading(false);
        }
    }

    return { appointments, loading, error, reload: loadAppointments };
}
