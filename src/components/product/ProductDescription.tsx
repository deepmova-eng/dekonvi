import React from 'react';

interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Description</h2>
      <p className="text-gray-600 whitespace-pre-line">{description}</p>
    </div>
  );
}