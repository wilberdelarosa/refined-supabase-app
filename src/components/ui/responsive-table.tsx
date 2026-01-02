import { useState } from 'react';
import { cn } from '@/lib/utils';

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' && window.innerWidth < 768
    );

    useState(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });

    return isMobile;
}

interface ResponsiveTableProps {
    desktop: React.ReactNode;
    mobile: React.ReactNode;
    className?: string;
}

export function ResponsiveTable({ desktop, mobile, className }: ResponsiveTableProps) {
    return (
        <>
            {/* Desktop view */}
            <div className={cn("hidden md:block", className)}>
                {desktop}
            </div>
            {/* Mobile view */}
            <div className={cn("block md:hidden", className)}>
                {mobile}
            </div>
        </>
    );
}
