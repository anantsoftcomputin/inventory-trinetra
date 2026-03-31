import { useState } from 'react';

export default function Logo({ className = 'w-8 h-8', imgClassName = 'w-full h-full object-contain' }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className={`${className} bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-sm leading-none">T</span>
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Trinetra"
      className={imgClassName}
      onError={() => setBroken(true)}
    />
  );
}
