import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileCardProps {
    children: ReactNode;
    className?: string;
    highlight?: boolean;
}

export function MobileCard({ children, className, highlight }: MobileCardProps) {
    return (
        <Card className={cn(
            "mb-3 hover:shadow-md transition-shadow",
            highlight && "border-l-4 border-l-primary bg-primary/5",
            className
        )}>
            <CardContent className="p-4">
                {children}
            </CardContent>
        </Card>
    );
}

interface MobileCardRowProps {
    label: string;
    value: ReactNode;
    className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
    return (
        <div className={cn("flex justify-between items-center py-2 border-b last:border-0", className)}>
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
            <span className="text-sm font-semibold">{value}</span>
        </div>
    );
}

interface MobileCardHeaderProps {
    title: string;
    subtitle?: string;
    badge?: ReactNode;
    image?: string;
}

export function MobileCardHeader({ title, subtitle, badge, image }: MobileCardHeaderProps) {
    return (
        <div className="flex items-start gap-3 mb-3 pb-3 border-b">
            {image && (
                <img
                    src={image}
                    alt={title}
                    className="w-16 h-16 object-cover rounded-lg border"
                />
            )}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{title}</h3>
                {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
            {badge && <div>{badge}</div>}
        </div>
    );
}

interface MobileCardActionsProps {
    children: ReactNode;
    className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
    return (
        <div className={cn("flex gap-2 mt-4 pt-4 border-t", className)}>
            {children}
        </div>
    );
}
