import { Toaster } from '@/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from '@/lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { isConfigured } from '@/api/supabase';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import ImportPage from '@/pages/Import';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

function AuthenticatedApp() {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  if (isLoadingAuth) return <Spinner />;
  if (!isAuthenticated) return <Login />;
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/Dashboard" element={<Navigate to="/" replace />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function NotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-lg font-semibold">Supabase ist noch nicht verbunden</h1>
        <p className="text-sm text-muted-foreground">
          Es fehlen VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY. Siehe Anleitung in docs/EINRICHTUNG.md.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <NotConfigured />;
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthenticatedApp />
        </Router>
        <Toaster position="bottom-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  );
}
