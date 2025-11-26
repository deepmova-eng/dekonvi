import React from 'react';
import { Search, Heart, Plus, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useConversations, useUnreadMessagesCount } from '../../hooks/useMessages';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  orientation?: 'horizontal' | 'vertical';
  showBadge?: boolean;
  sellerId?: string;
  badgeCount?: number;
}

const NavItem = ({
  icon,
  label,
  isActive,
  onClick,
  orientation = 'horizontal',
  showBadge,
  badgeCount
}: NavItemProps) => {
  const { user } = useSupabaseAuth();

  return (
    <button
      onClick={onClick}
      className={`flex items-center relative ${orientation === 'vertical'
        ? 'w-full p-3 mb-2'
        : 'flex-1 flex-col justify-center items-center py-2'
        } ${isActive
          ? 'text-primary-500'
          : 'text-gray-500 hover:text-primary-500'
        }`}
    >
      <div className="relative">
        {icon}
        {showBadge && <NotificationBadge count={badgeCount} />}
      </div>
      <span className={`${orientation === 'vertical' ? 'ml-3' : 'text-xs mt-1'}`}>
        {label}
      </span>
    </button>
  );
};

interface BottomNavProps {
  activeTab: string;
  orientation?: 'horizontal' | 'vertical';
  sellerId?: string;
  onCreateListing: () => void;
}

export default function BottomNav({
  activeTab,
  orientation = 'horizontal',
  sellerId,
  onCreateListing
}: BottomNavProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { data: unreadCount = 0 } = useUnreadMessagesCount(user?.id);

  return (
    <div className={`
      ${orientation === 'vertical'
        ? 'flex flex-col'
        : 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe w-full'
      }
    `}>
      <div className={`
        ${orientation === 'vertical'
          ? 'flex flex-col w-full'
          : 'flex w-full'
        }
      `}>
        <NavItem
          icon={<Search size={24} />}
          label="Rechercher"
          isActive={activeTab === 'search'}
          onClick={() => navigate('/')}
          orientation={orientation}
        />
        <NavItem
          icon={<Heart size={24} />}
          label="Favoris"
          isActive={activeTab === 'favorites'}
          onClick={() => navigate('/favorites')}
          orientation={orientation}
        />
        <NavItem
          icon={<Plus size={24} />}
          label="Publier"
          isActive={activeTab === 'create'}
          onClick={onCreateListing}
          orientation={orientation}
        />
        <NavItem
          icon={<MessageCircle size={24} />}
          label="Messages"
          isActive={activeTab === 'messages'}
          onClick={() => navigate('/messages')}
          orientation={orientation}
          showBadge={true}
          badgeCount={unreadCount}
        />
        <NavItem
          icon={<User size={24} />}
          label="Mon Compte"
          isActive={activeTab === 'profile'}
          onClick={() => navigate('/profile')}
          orientation={orientation}
        />
      </div>
    </div>
  );
}