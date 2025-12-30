import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'manager' | 'editor' | 'support' | 'customer';

interface UseRolesReturn {
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  isSupport: boolean;
  hasRole: (role: AppRole) => boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageContent: boolean;
  canManageUsers: boolean;
}

export function useRoles(): UseRolesReturn {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching roles:', error);
          setRoles([]);
        } else {
          setRoles((data || []).map(r => r.role as AppRole));
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isEditor = hasRole('editor');
  const isSupport = hasRole('support');

  return {
    roles,
    loading,
    isAdmin,
    isManager,
    isEditor,
    isSupport,
    hasRole,
    canManageProducts: isAdmin || isManager,
    canManageOrders: isAdmin || isManager || isSupport,
    canManageContent: isAdmin || isEditor,
    canManageUsers: isAdmin,
  };
}
