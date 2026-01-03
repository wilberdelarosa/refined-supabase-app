/**
 * APPOINTMENTS MICROSERVICE - FEATURE FLAGS
 * 
 * Configuración centralizada para habilitar/deshabilitar
 * el microservicio de citas sin tocar código
 */

export const APPOINTMENTS_CONFIG = {
    // ============================================
    // FEATURE FLAG PRINCIPAL
    // ============================================
    ENABLED: true, // Cambiar a false para desactivar completamente

    // ============================================
    // CONFIGURACIÓN DE AMBIENTE
    // ============================================
    API_BASE_URL: import.meta.env.VITE_APPOINTMENTS_API_URL || '/api/appointments',

    // ============================================
    // FEATURES ESPECÍFICAS
    // ============================================
    FEATURES: {
        // Mostrar banner en productos
        SHOW_PRODUCT_BANNER: true,

        // Enlace en navbar
        SHOW_NAVBAR_LINK: true,

        // Sección en perfil de usuario
        SHOW_IN_USER_PROFILE: true,

        // Suggestions en carrito
        SHOW_CART_SUGGESTIONS: true,

        // Sistema de cotizaciones
        ENABLE_QUOTES: true,

        // Formularios dinámicos
        ENABLE_DYNAMIC_FORMS: true,

        // Integraciones externas
        ENABLE_VIDEO_CALLS: false, // Requiere configuración adicional
        ENABLE_SMS_NOTIFICATIONS: false, // Requiere Twilio
        ENABLE_EMAIL_NOTIFICATIONS: true,
    },

    // ============================================
    // PRECIOS Y CONFIGURACIÓN DE NEGOCIO
    // ============================================
    BUSINESS: {
        DEFAULT_SESSION_PRICE: 1500, // RD$
        DEFAULT_SESSION_DURATION: 60, // minutos
        POST_CONSULTATION_DISCOUNT: 0.10, // 10% descuento
        CANCELLATION_HOURS_LIMIT: 24, // Horas antes para cancelar sin penalidad
    },

    // ============================================
    // LÍMITES Y VALIDACIONES
    // ============================================
    LIMITS: {
        MAX_APPOINTMENTS_PER_USER: 10, // Citas activas simultáneas
        ADVANCE_BOOKING_DAYS: 60, // Días máximos de anticipación
        MIN_ADVANCE_BOOKING_HOURS: 2, // Horas mínimas de anticipación
    },
} as const;

/**
 * Hook para verificar si el microservicio está habilitado
 */
export function useAppointmentsEnabled() {
    return APPOINTMENTS_CONFIG.ENABLED;
}

/**
 * Hook para verificar features específicas
 */
export function useAppointmentFeature(feature: keyof typeof APPOINTMENTS_CONFIG.FEATURES) {
    return APPOINTMENTS_CONFIG.ENABLED && APPOINTMENTS_CONFIG.FEATURES[feature];
}
