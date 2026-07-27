'use client';

import React, { useState, useEffect } from 'react';
import { BlocklyWorkspace } from '../components/BlocklyWorkspace';
import { Scene } from '../components/Scene';
import { TaskPanel } from '../components/TaskPanel';
import { CommandDispatcher, Command } from '../core/CommandDispatcher';

export default function Home() {
  const [tasks, setTasks] = useState([
    { id: 't1', description: 'Change Timmy\'s shirt colour', completed: false },
    { id: 't2', description: 'Change Timmy\'s name', completed: false },
    { id: 't3', description: 'Set Energy level', completed: false },
    { id: 't4', description: 'Make Timmy wave', completed: false },
    { id: 't5', description: 'Make Timmy walk to the right', completed: false },
    { id: 't6', description: 'Make Timmy jump', completed: false },
  ]);

  useEffect(() => {
    // Listen to commands and update tasks
    const handleCommand = (cmd: Command) => {
      if (cmd.target !== 'timmy') return;

      setTasks(prev => prev.map(task => {
        if (cmd.type === 'changeShirtColour' && task.id === 't1') return { ...task, completed: true };
        if (cmd.type === 'changeName' && task.id === 't2') return { ...task, completed: true };
        if (cmd.type === 'setEnergy' && task.id === 't3') return { ...task, completed: true };
        if (cmd.type === 'wave' && task.id === 't4') return { ...task, completed: true };
        if (cmd.type === 'walkRight' && task.id === 't5') return { ...task, completed: true };
        if (cmd.type === 'jump' && task.id === 't6') return { ...task, completed: true };
        return task;
      }));
    };

    const unsubscribe = CommandDispatcher.subscribe(handleCommand);
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-100 p-4 gap-4 font-sans text-slate-800">
      
      {/* Left Panel: Blockly Workspace (30%) */}
      <div className="w-[30%] h-full flex flex-col">
        <BlocklyWorkspace />
      </div>

      {/* Centre Panel: Visual Scene (45%) */}
      <div className="flex-1 h-full flex flex-col relative">
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <h1 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Object State & Behaviour
          </h1>
        </div>
        <Scene />
      </div>

      {/* Right Panel: Task Panel (25%) */}
      <div className="w-[25%] h-full flex flex-col">
        <TaskPanel 
          story="Timmy wants to introduce himself and wave to his friend. Use the blocks to program Timmy's state and behaviour!"
          tasks={tasks}
          hint="Try attaching blocks together. First change his state (Name, Colour), then add behaviours like Wave or Jump. Press Run when you are ready!"
        />
      </div>

    </div>
  );
}