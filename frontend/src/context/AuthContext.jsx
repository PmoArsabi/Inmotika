import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { clearCatalogCache } from '../hooks/useCatalog';
import { clearEstadoCache } from '../api/estadoApi';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const fetchProfile = useCallback(async (userId, currentSession = null) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('perfil_usuario')
        .select(`
          id, rol_id, estado_id, nombres, apellidos, email, telefono, avatar_url,
          catalogo_rol (codigo, nombre),
          catalogo:estado_id (codigo)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error al cargar perfil_usuario:', profileError);
      }

      if (profile) {
        let roleCode = profile.catalogo_rol?.codigo ?? null;
        let roleName = profile.catalogo_rol?.nombre ?? null;
        let statusCode = profile.catalogo?.codigo ?? 'ACTIVO';
        if (!roleCode && profile.rol_id) {
          const { data: rol } = await supabase
            .from('catalogo_rol')
            .select('codigo, nombre')
            .eq('id', profile.rol_id)
            .maybeSingle();
          if (rol) {
            roleCode = rol.codigo;
            roleName = rol.nombre;
          }
        }

        if (!roleCode) {
          console.warn('[AuthContext] No se pudo resolver el rol del usuario:', userId);
        }

        setUser({
          ...profile,
          role: roleCode ?? null,
          roleName: roleName ?? null,
          status: statusCode,
          email: currentSession?.user?.email ?? profile.email ?? null,
          nombres: profile.nombres || '',
          apellidos: profile.apellidos || '',
        });
      } else if (!profileError) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const isInviteOrRecovery = hash && (hash.includes('type=recovery') || hash.includes('type=invite') || hash.includes('type=signup'));

    if (isInviteOrRecovery) {
      setIsRecoveryFlow(true);
      sessionStorage.setItem('inmotika_recovery_flow', 'true');
    } else {
      const persisted = sessionStorage.getItem('inmotika_recovery_flow');
      if (persisted === 'true') {
        setIsRecoveryFlow(true);
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      setLoading(false);
      return () => {};
    }

    const timer = setTimeout(() => {
      console.warn('AuthContext: Failsafe activado (Carga lenta)');
      setLoading(false);
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session).finally(() => {
          setLoading(false);
          clearTimeout(timer);
        });
      } else {
        setLoading(false);
        clearTimeout(timer);
      }
    }).catch((error) => {
      console.error('Error al obtener sesión:', error);
      setLoading(false);
      clearTimeout(timer);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }
      if (event === 'PASSWORD_RECOVERY' || (
        (event === 'SIGNED_IN') &&
        (sessionStorage.getItem('inmotika_recovery_flow') === 'true' ||
         window.location.hash.includes('type=recovery') ||
         window.location.hash.includes('type=invite'))
      )) {
        setSession(session);
        setIsRecoveryFlow(true);
        sessionStorage.setItem('inmotika_recovery_flow', 'true');
        setLoading(false);
        clearTimeout(timer);
        return;
      }

      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session);
      } else {
        setUser(null);
        setLoading(false);
        clearTimeout(timer);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      clearTimeout(timer);
    };
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en signIn:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    clearCatalogCache();
    clearEstadoCache();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}`,
    });
    if (error) throw error;
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
    updatePassword,
    resetPassword,
    isRecoveryFlow,
    setIsRecoveryFlow,
    refreshProfile: () => fetchProfile(session?.user?.id),
    clearRecoveryFlow: () => {
      setIsRecoveryFlow(false);
      sessionStorage.removeItem('inmotika_recovery_flow');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando Inmotika...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
