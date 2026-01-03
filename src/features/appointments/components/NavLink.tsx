import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useAppointmentFeature } from '../config';

export default function AppointmentsNavLink() {
    const showLink = useAppointmentFeature('SHOW_NAVBAR_LINK');

    if (!showLink) return null;

    return (
        <Link to="/appointments">
            <Button variant="ghost" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">Citas</span>
            </Button>
        </Link>
    );
}
