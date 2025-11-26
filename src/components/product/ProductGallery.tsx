import React from 'react';

interface ProductGalleryProps {
  images: string[];
  currentIndex: number;
  title: string;
}

export default function ProductGallery({ images, currentIndex, title }: ProductGalleryProps) {
  return (
    <div className="relative bg-black">
      <div className="aspect-square">
        <img
          src={images[currentIndex]}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1}/{images.length}
        </div>
      )}
    </div>
  );
}