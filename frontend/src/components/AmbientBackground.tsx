import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#F6F3EE]">
      {/* Architectural Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#18181B_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-10" />

      {/* Subtle Structural Paper Frame */}
      <div className="absolute inset-2 sm:inset-4 border border-[#18181B]/10 rounded-2xl pointer-events-none" />
    </div>
  );
};
