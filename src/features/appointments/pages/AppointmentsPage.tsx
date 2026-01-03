import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNutritionists } from '../../hooks/useAppointments';
import { NutritionistCard } from '../components/client/NutritionistCard';
import { Nutritionist } from '../../api';

export default function AppointmentsPage() {
    const navigate = useNavigate();
    const { nutritionists, loading } = useNutritionists();
    const [search, setSearch] = useState('');

    const filteredNutritionists = nutritionists.filter(n =>
        n.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        n.specialization.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

    function handleSelectNutritionist(nutritionist: Nutritionist) {
        navigate(`/appointments/book/${nutritionist.id}`);
    }

    return (
        <Layout>
            <div className="container py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-display text-3xl font-bold mb-2">
                                Consulta con un Nutricionista
                            </h1>
                            <p className="text-muted-foreground">
                                Agenda una cita con nuestros expertos certificados
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o especialización..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Info Banner */}
                <Card className="mb-8 bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold mb-2">¿Por qué agendar una consulta?</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>✓ Recibe recomendaciones personalizadas</li>
                                    <li>✓ Conoce qué suplementos son adecuados para ti</li>
                                    <li>✓ Obtén un plan nutricional ajustado a tus objetivos</li>
                                    <li>✓ <strong>10% de descuento</strong> en productos recomendados</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Nutritionists Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        <p className="text-muted-foreground mt-4">Cargando nutricionistas...</p>
                    </div>
                ) : filteredNutritionists.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No se encontraron nutricionistas</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredNutritionists.map((nutritionist) => (
                            <NutritionistCard
                                key={nutritionist.id}
                                nutritionist={nutritionist}
                                onSelect={handleSelectNutritionist}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
