import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, className = "h-8 w-8 rounded-full" }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const fallbackChar = name ? name.trim().charAt(0) : '?';
  
  // Estimate height/width to scale text size
  let fontSizeClass = 'text-sm';
  if (className.includes('w-32') || className.includes('h-32')) {
    fontSizeClass = 'text-4xl';
  } else if (className.includes('w-16') || className.includes('h-16')) {
    fontSizeClass = 'text-xl';
  } else if (className.includes('w-12') || className.includes('h-12')) {
    fontSizeClass = 'text-lg';
  }

  if (!src || error) {
    return (
      <div 
        className={`${className} bg-brand-100 text-brand-700 flex items-center justify-center font-bold border border-brand-200 uppercase select-none`}
      >
        <span className={fontSizeClass}>{fallbackChar}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={`${className} object-cover`}
      onError={() => setError(true)}
    />
  );
};

export default Avatar;
