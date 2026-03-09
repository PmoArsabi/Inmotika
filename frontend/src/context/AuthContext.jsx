import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Iniciando comprobación de sesión...');
    
    // Failsafe: Si en 8 segundos no ha respondido, forzamos el cierre del loading
    const timer = setTimeout(() => {
      console.warn('AuthContext: Failsafe activado (Carga lenta)');
      setLoading(false);
    }, 8000);

    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Sesión inicial:', session ? 'OK' : 'NULL');
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
    });

    // 2. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Evento de Auth:', event);
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
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchProfile = async (userId, currentSession = null) => {
    try {
      console.log('AuthContext: Cargando perfil...');
      
      const { data, error } = await supabase
        .from('perfil_usuario')
        .select(`
          *,
          catalogo_rol (codigo, nombre),
          catalogo_estado_general (codigo, nombre)
        `)
        .eq('id', userId)
        .single();

      if (data) {
        console.log('AuthContext: Perfil cargado correctamente');
        setUser({
          ...data,
          role: data.catalogo_rol?.codigo || 'ADMIN',
          roleName: data.catalogo_rol?.nombre || 'Administrador',
          status: data.catalogo_estado_general?.codigo || 'ACTIVO',
          email: currentSession?.user?.email || null
        });
      } else {
        console.warn('AuthContext: No se encontró perfil, usando fallback local');
        setUser({
          id: userId,
          email: currentSession?.user?.email,
          role: 'ADMIN',
          status: 'ACTIVO',
          nombre_completo: currentSession?.user?.email?.split('@')[0] || 'Usuario'
        });
      }
    } catch (err) {
      console.error('AuthContext: Error en fetchProfile:', err);
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

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
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
