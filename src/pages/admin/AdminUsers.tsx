import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, ArrowLeft, Shield, Users } from 'lucide-react';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrador', description: 'Acceso total al sistema', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { value: 'manager', label: 'Manager', description: 'Gestión de productos, pedidos e inventario', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { value: 'editor', label: 'Editor', description: 'Gestión de contenido (blog, páginas)', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'support', label: 'Soporte', description: 'Ver pedidos y atención al cliente', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { value: 'customer', label: 'Cliente', description: 'Usuario normal de la tienda', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !isAdmin) {
        navigate('/admin');
      }
    }
  }, [user, authLoading, rolesLoading, isAdmin, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);

    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, created_at');

    if (profilesError) {
      toast({ title: 'Error', description: 'No se pudieron cargar los usuarios', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Get all roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    // Combine data
    const usersWithRoles: UserWithRoles[] = (profiles || []).map(p => ({
      id: p.user_id,
      email: p.email || '',
      full_name: p.full_name,
      created_at: p.created_at,
      roles: (roles || [])
        .filter(r => r.user_id === p.user_id)
        .map(r => r.role),
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  }

  function openRoleDialog(userItem: UserWithRoles) {
    setSelectedUser(userItem);
    setSelectedRoles([...userItem.roles]);
    setIsDialogOpen(true);
  }

  function toggleRole(role: string) {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  }

  async function saveRoles() {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Remove all existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      // Add new roles
      if (selectedRoles.length > 0) {
        const rolesToInsert = selectedRoles.map(role => ({
          user_id: selectedUser.id,
          role: role as 'admin' | 'manager' | 'editor' | 'support' | 'customer',
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (error) throw error;
      }

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: 'UPDATE_ROLES',
        p_table_name: 'user_roles',
        p_record_id: selectedUser.id,
        p_old_data: { roles: selectedUser.roles },
        p_new_data: { roles: selectedRoles }
      });

      toast({ title: 'Éxito', description: 'Roles actualizados correctamente' });
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleConfig = (role: string) => {
    return AVAILABLE_ROLES.find(r => r.value === role) || {
      label: role,
      color: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b8cee]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="hover-lift hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
              <Users className="h-7 w-7 text-slate-700" />
              Gestión de Usuarios
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6 shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="pt-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por email o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-slate-200 bg-slate-50 focus:border-[#2b8cee] focus:ring-[#2b8cee]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-bold text-slate-700">Usuario</TableHead>
                  <TableHead className="font-bold text-slate-700">Roles</TableHead>
                  <TableHead className="font-bold text-slate-700">Fecha registro</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100">
                          <Users className="h-12 w-12 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No se encontraron usuarios</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userItem) => (
                    <TableRow key={userItem.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{userItem.full_name || 'Sin nombre'}</p>
                          <p className="text-sm text-slate-500">{userItem.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userItem.roles.length === 0 ? (
                            <span className="text-sm text-slate-400 italic">Sin roles</span>
                          ) : (
                            userItem.roles.map(role => {
                              const config = getRoleConfig(role);
                              return (
                                <Badge key={role} variant="outline" className={`${config.color} font-medium`}>
                                  {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                  {config.label}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(userItem.created_at).toLocaleDateString('es-DO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleDialog(userItem)}
                          className="hover:bg-slate-100 border-slate-200 text-slate-700"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Gestionar Roles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Roles Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Gestionar Roles</DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {AVAILABLE_ROLES.map(role => (
              <div
                key={role.value}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${selectedRoles.includes(role.value)
                    ? 'border-[#2b8cee] bg-[#2b8cee]/5'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRole(role.value)}
                  className="mt-1 data-[state=checked]:bg-[#2b8cee] data-[state=checked]:border-[#2b8cee]"
                />
                <div className="flex-1">
                  <Label htmlFor={role.value} className="font-medium cursor-pointer text-slate-900 block mb-0.5">
                    {role.label}
                  </Label>
                  <p className="text-sm text-slate-500 leading-snug">{role.description}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-200 text-slate-700">
              Cancelar
            </Button>
            <Button onClick={saveRoles} disabled={saving} className="bg-[#2b8cee] hover:bg-[#206bc4] text-white">
              {saving ? 'Guardando...' : 'Guardar Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
