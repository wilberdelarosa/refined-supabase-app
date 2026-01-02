import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Layout } from '@/components/layout/Layout';
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
import { MobileCard, MobileCardHeader, MobileCardRow, MobileCardActions } from '@/components/ui/mobile-card';
import { Search, ArrowLeft, Shield, Users } from 'lucide-react';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrador', description: 'Acceso total al sistema' },
  { value: 'manager', label: 'Manager', description: 'Gestión de productos, pedidos e inventario' },
  { value: 'editor', label: 'Editor', description: 'Gestión de contenido (blog, páginas)' },
  { value: 'support', label: 'Soporte', description: 'Ver pedidos y atención al cliente' },
  { value: 'customer', label: 'Cliente', description: 'Usuario normal de la tienda' },
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

  if (authLoading || rolesLoading || loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-display text-2xl font-bold">Usuarios</h1>
                <p className="text-muted-foreground text-sm">
                  {users.length} usuarios registrados
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Fecha registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No se encontraron usuarios</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{userItem.full_name || 'Sin nombre'}</p>
                              <p className="text-sm text-muted-foreground">{userItem.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userItem.roles.length === 0 ? (
                                <span className="text-sm text-muted-foreground">Sin roles</span>
                              ) : (
                                userItem.roles.map(role => (
                                  <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                                    {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                    {role}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(userItem.created_at).toLocaleDateString('es-DO')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(userItem)}
                            >
                              Gestionar Roles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden p-4 space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No se encontraron usuarios</p>
                  </div>
                ) : (
                  filteredUsers.map((userItem) => (
                    <MobileCard key={userItem.id}>
                      <MobileCardHeader
                        title={userItem.full_name || 'Sin nombre'}
                        subtitle={userItem.email}
                      />
                      <MobileCardRow
                        label="Roles"
                        value={
                          <div className="flex flex-wrap gap-1 justify-end">
                            {userItem.roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Sin roles</span>
                            ) : (
                              userItem.roles.map(role => (
                                <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                  {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                  {role}
                                </Badge>
                              ))
                            )}
                          </div>
                        }
                      />
                      <MobileCardRow
                        label="Registro"
                        value={new Date(userItem.created_at).toLocaleDateString('es-DO')}
                      />
                      <MobileCardActions>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => openRoleDialog(userItem)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Gestionar Roles
                        </Button>
                      </MobileCardActions>
                    </MobileCard>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Roles Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Roles</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {AVAILABLE_ROLES.map(role => (
              <div key={role.value} className="flex items-start gap-3 p-3 rounded-lg border">
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRole(role.value)}
                />
                <div className="flex-1">
                  <Label htmlFor={role.value} className="font-medium cursor-pointer">
                    {role.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRoles} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
