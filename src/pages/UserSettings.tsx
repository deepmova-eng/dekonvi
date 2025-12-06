import { ChevronLeft, User, MapPin, Lock, ChevronRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
}

function SettingsItem({ icon, title, onClick }: SettingsItemProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
            <div className="flex items-center gap-3">
                <div className="text-gray-600">{icon}</div>
                <span className="text-base font-medium text-gray-900">{title}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
    );
}

export default function UserSettings() {
    const navigate = useNavigate();
    const { signOut } = useSupabaseAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold">Paramètres</h1>
                    </div>
                </div>
            </div>

            {/* Settings List */}
            <div className="max-w-2xl mx-auto mt-4">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <SettingsItem
                        icon={<User className="w-5 h-5" />}
                        title="Informations personnelles"
                        onClick={() => navigate('/settings/personal-info')}
                    />
                    <SettingsItem
                        icon={<MapPin className="w-5 h-5" />}
                        title="Mes Adresses"
                        onClick={() => navigate('/settings/addresses')}
                    />
                    <SettingsItem
                        icon={<Lock className="w-5 h-5" />}
                        title="Sécurité & Connexion"
                        onClick={() => navigate('/settings/security')}
                    />
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors shadow-sm"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
    );
}
