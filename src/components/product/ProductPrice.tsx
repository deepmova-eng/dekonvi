import React from 'react';

interface ProductPriceProps {
  price: number;
  deliveryAvailable?: boolean;
}

export default function ProductPrice({ price, deliveryAvailable }: ProductPriceProps) {
  return (
    <div>
      <div className="text-2xl font-bold">{price.toLocaleString('fr-FR')} €</div>
      {deliveryAvailable && (
        <div className="text-sm text-gray-600 mt-1">
          Livraison : à partir de 2,88 €
        </div>
      )}
      <div className="text-sm text-gray-500 mt-1">
        Aujourd'hui à {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}