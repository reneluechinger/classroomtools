import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';
import { setCurrentEmail } from '@/api/db';
import { queryClientInstance } from '@/lib/query-client';

const AuthContext = createContext(null);

const toUser = (session) =>
  session?.user ? { id: session.user.id, email: session.user.email } : null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const apply = (session) => {
      const u = toUser(session);
      setCurrentEmail(u?.email ?? null);
      setUser(u);
      setIsLoadingAuth(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    queryClientInstance.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoadingAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
