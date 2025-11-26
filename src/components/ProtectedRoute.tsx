import { Navigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import LoadingFallback from './common/LoadingFallback';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, loading, isAdmin } = useSupabase();

    if (loading) {
        return <LoadingFallback />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
