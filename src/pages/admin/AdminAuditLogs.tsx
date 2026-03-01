import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Search, Filter } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
}

const actionColors: Record<string, string> = {
  ORDER_CREATED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  INVOICE_CREATED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  INVOICE_CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
  TEMPLATE_UPDATED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  TEMPLATE_CREATED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  ORDER_STATUS_CHANGED: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const PAGE_SIZE = 50;

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateFrom, dateTo, page]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) console.error('Error loading audit logs:', error);
    setLogs(data || []);
    setLoading(false);
  }

  const getActionBadgeClass = (action: string) =>
    actionColors[action] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
              <ClipboardList className="h-7 w-7 text-slate-700" />
              Registro de Auditoría
            </h1>
            <p className="text-slate-500 text-sm mt-1">Trazabilidad completa de acciones del sistema</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-sm border border-slate-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
                <SelectTrigger className="border-slate-200 bg-slate-50">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filtrar por acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="ORDER_CREATED">Pedido Creado</SelectItem>
                  <SelectItem value="INVOICE_CREATED">Factura Creada</SelectItem>
                  <SelectItem value="INVOICE_CANCELLED">Factura Anulada</SelectItem>
                  <SelectItem value="TEMPLATE_UPDATED">Plantilla Actualizada</SelectItem>
                  <SelectItem value="TEMPLATE_CREATED">Plantilla Creada</SelectItem>
                  <SelectItem value="ORDER_STATUS_CHANGED">Estado Pedido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="w-auto border-slate-200 bg-slate-50"
              placeholder="Desde"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="w-auto border-slate-200 bg-slate-50"
              placeholder="Hasta"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-slate-100">
                  <ClipboardList className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No hay registros de auditoría</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                    <TableHead className="font-bold text-slate-700">Fecha</TableHead>
                    <TableHead className="font-bold text-slate-700">Acción</TableHead>
                    <TableHead className="font-bold text-slate-700">Tabla</TableHead>
                    <TableHead className="font-bold text-slate-700">Registro</TableHead>
                    <TableHead className="font-bold text-slate-700">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                        {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getActionBadgeClass(log.action)} font-medium border`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-700">{log.table_name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {log.record_id ? log.record_id.slice(0, 8) + '…' : '—'}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-xs text-slate-500">
                        {log.new_data ? JSON.stringify(log.new_data).slice(0, 120) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-slate-500">Página {page + 1}</span>
              <Button variant="outline" size="sm" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
