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
    if (hash && (hash.includes('type=recovery') || hash.includes('type=invite') || hash.includes('type=signup'))) {
      setIsRecoveryFlow(true);
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const enforceMock = false;
    if (!supabaseUrl || !supabaseAnonKey || (enforceMock && import.meta.env.DEV)) {
      // Simular que no hay sesión activa real pero ya cargó el store
      setLoading(false);
      return () => {}; // return empty cleanup function
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
      const { data, error } = await supabase
        .from('perfil_usuario')
        .select(`
          *,
          catalogo_rol (codigo, nombre),
          catalogo_estado_general (codigo, nombre)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUser({
          ...data,
          role: data.catalogo_rol?.codigo || 'ADMIN',
          roleName: data.catalogo_rol?.nombre || 'Administrador',
          status: data.catalogo_estado_general?.codigo || 'ACTIVO',
          email: currentSession?.user?.email || null,
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
        });
      } else {
        // Perfil no encontrado aún (ej: trigger aún no ejecutó)
        const emailPrefix = currentSession?.user?.email?.split('@')[0] || 'Usuario';
        setUser({
          id: userId,
          email: currentSession?.user?.email,
          role: 'ADMIN',
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
    const enforceMock = false;
    if (enforceMock) {
      return new Promise(resolve => setTimeout(resolve, 1000));
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const enforceMock = false;
    if (enforceMock) {
      return new Promise(resolve => setTimeout(resolve, 1000));
    }

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
    refreshProfile: () => fetchProfile(session?.user?.id)
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
