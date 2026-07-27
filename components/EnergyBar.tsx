import React from 'react';

interface EnergyBarProps {
  energy: number;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ energy }) => {
  // Clamp energy between 0 and 100
  const clampedEnergy = Math.max(0, Math.min(100, energy));
  
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-bold text-gray-700 tracking-wider text-sm uppercase">Energy</span>
      <div className="w-48 h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner border border-gray-300">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
          style={{ width: `${clampedEnergy}%` }}
        />
      </div>
    </div>
  );
};
