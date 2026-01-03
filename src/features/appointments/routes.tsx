/**
 * APPOINTMENTS ROUTES
 * 
 * Exporta las rutas del microservicio para integrarse en App.tsx
 */

import { lazy } from 'react';
import { APPOINTMENTS_CONFIG } from './config';

// Lazy load pages
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));

/**
 * Rutas del microservicio
 * Solo se agregan si ENABLED = true
 */
export const appointmentsRoutes = APPOINTMENTS_CONFIG.ENABLED
    ? [
        {
            path: '/appointments',
            element: <AppointmentsPage />,
        },
        {
            path: '/appointments/book/:nutritionistId',
            element: <BookingPage />,
        },
    ]
    : [];

/**
 * Componente para agregar en Navbar (condicional)
 */
export { default as AppointmentsNavLink } from './components/NavLink.tsx';
