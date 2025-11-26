import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function ContactButton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
      <button className="w-full bg-[#004675] text-white py-3 rounded-lg font-semibold hover:bg-[#003557] transition-colors flex items-center justify-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Contacter
      </button>
    </div>
  );
}