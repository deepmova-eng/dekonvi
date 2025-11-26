import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetwork } from '../../hooks/useNetwork';

export default function OfflineIndicator() {
  const isOnline = useNetwork();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center pointer-events-none z-50">
      <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Mode hors ligne</span>
      </div>
    </div>
  );
}