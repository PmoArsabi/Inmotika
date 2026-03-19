import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  useEffect(() => {
    // Detectar flujo de recuperación ANTES que nada
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
    
    // Failsafe: Si en 8 segundos no ha respondido, forzamos el cierre del loading
    const timer = setTimeout(() => {
      console.warn('AuthContext: Failsafe activado (Carga lenta)');
      setLoading(false);
    }, 8000);

    // 1. Obtener sesión inicial
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

    // 2. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        // No llamamos a setLoading(true) aquí para evitar que la app se desmonte al loguear
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
  }, []);

  const fetchProfile = async (userId, currentSession = null) => {
    try {
      // Una sola consulta con joins: más rápido que 3 peticiones (RLS ya permite leer rol y estado)
      const { data: profile, error: profileError } = await supabase
        .from('perfil_usuario')
        .select(`
          id, rol_id, estado_id, nombres, apellidos, email, telefono, avatar_url,
          catalogo_rol (codigo, nombre),
          catalogo_estado_general (codigo)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error al cargar perfil_usuario:', profileError);
      }

      if (profile) {
        let roleCode = profile.catalogo_rol?.codigo ?? null;
        let roleName = profile.catalogo_rol?.nombre ?? null;
        let statusCode = profile.catalogo_estado_general?.codigo ?? 'ACTIVO';
        // Si el join no trajo el rol (p. ej. RLS puntual), fallback con una consulta extra
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

        setUser({
          ...profile,
          role: roleCode || 'CLIENTE',
          roleName: roleName || 'Cliente',
          status: statusCode,
          email: currentSession?.user?.email ?? profile.email ?? null,
          nombres: profile.nombres || '',
          apellidos: profile.apellidos || '',
        });
      } else {
        // Perfil no encontrado (trigger pendiente o RLS): no asumir ADMIN
        const emailPrefix = currentSession?.user?.email?.split('@')[0] || 'Usuario';
        setUser({
          id: userId,
          email: currentSession?.user?.email,
          role: 'CLIENTE',
          status: 'ACTIVO',
          nombres: emailPrefix,
          apellidos: '',
        });
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en signIn:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
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
            <div className="w-12 h-12 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando Inmotika...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
