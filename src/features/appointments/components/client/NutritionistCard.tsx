import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, Award } from 'lucide-react';
import { Nutritionist } from '../../api';

interface NutritionistCardProps {
    nutritionist: Nutritionist;
    onSelect: (nutritionist: Nutritionist) => void;
}

export function NutritionistCard({ nutritionist, onSelect }: NutritionistCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(nutritionist)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{nutritionist.full_name || 'Nutricionista'}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{nutritionist.email}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{nutritionist.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                ({nutritionist.total_consultations} consultas)
                            </span>
                        </div>

                        {/* Specializations */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {nutritionist.specialization.map((spec) => (
                                <Badge key={spec} variant="secondary" className="text-xs">
                                    {spec}
                                </Badge>
                            ))}
                        </div>

                        {/* Bio */}
                        {nutritionist.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {nutritionist.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{nutritionist.consultation_duration} min</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">
                            RD${nutritionist.price_per_session.toFixed(2)}
                        </span>
                        <Button size="sm">
                            Agendar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
