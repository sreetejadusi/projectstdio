'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Timmy, TimmyHandle } from './Timmy';
import { EnergyBar } from './EnergyBar';
import { CommandDispatcher, Command } from '../core/CommandDispatcher';

export const Scene: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [shirtColor, setShirtColor] = useState<string>('#4F8EF7');
  const [energy, setEnergy] = useState<number>(100);
  
  const timmyRef = useRef<TimmyHandle>(null);

  useEffect(() => {
    const handleCommand = async (cmd: Command) => {
      if (cmd.target !== 'timmy') return;

      switch (cmd.type) {
        case 'changeName':
          setName(cmd.payload);
          break;
        case 'changeShirtColour':
          setShirtColor(cmd.payload);
          break;
        case 'setEnergy':
          setEnergy(cmd.payload);
          break;
        case 'wave':
          if (timmyRef.current) await timmyRef.current.wave();
          break;
        case 'walkRight':
          if (timmyRef.current) await timmyRef.current.walkRight();
          break;
        case 'jump':
          if (timmyRef.current) await timmyRef.current.jump();
          break;
      }
    };

    const unsubscribe = CommandDispatcher.subscribe(handleCommand);
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-xl shadow-inner border border-slate-200 overflow-hidden relative p-8">
      
      {/* HUD: Name and Energy */}
      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-4 z-10">
        {name && (
          <div className="bg-white px-6 py-2 rounded-full shadow-md text-xl font-bold text-slate-800 border border-slate-100 transition-all">
            {name}
          </div>
        )}
        <EnergyBar energy={energy} />
      </div>
      
      {/* Character */}
      <div className="mt-20">
        <Timmy ref={timmyRef} shirtColor={shirtColor} />
      </div>
      
      {/* Ground/Stage */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-200 to-transparent pointer-events-none" />
      
    </div>
  );
};
