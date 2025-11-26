import React from 'react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl',
};

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
    const [error, setError] = React.useState(false);

    if (src && !error) {
        return (
            <img
                src={src}
                alt={alt || 'Avatar'}
                className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div
            className={`bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold ${sizeClasses[size]} ${className}`}
        >
            {alt ? alt.charAt(0).toUpperCase() : '?'}
        </div>
    );
}
