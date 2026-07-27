'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import { defineBlocks, generateCommands, toolboxConfig } from '../blocks/customBlocks';
import { CommandDispatcher } from '../core/CommandDispatcher';
import { Play } from 'lucide-react';

Blockly.setLocale(En);

export const BlocklyWorkspace: React.FC = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Define blocks once
    defineBlocks();

    if (blocklyDiv.current && !workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxConfig,
        scrollbars: true,
        trashcan: true,
        theme: Blockly.Theme.defineTheme('modern', {
          base: Blockly.Themes.Classic,
          componentStyles: {
            workspaceBackgroundColour: '#f8fafc',
            toolboxBackgroundColour: '#ffffff',
            toolboxForegroundColour: '#334155',
            flyoutBackgroundColour: '#f1f5f9',
            flyoutForegroundColour: '#334155',
          },
        }),
      });

      // Add the root Timmy Object block automatically
      const timmyBlock = workspaceRef.current.newBlock('timmy_object');
      timmyBlock.initSvg();
      timmyBlock.render();
      timmyBlock.moveBy(20, 20);
    }

    return () => {
      // In strict mode this might unmount/remount, Blockly doesn't love it, but we can try to dispose
      if (workspaceRef.current) {
        // Unfortunately calling dispose on unmount in Next.js dev mode strict can cause issues 
        // if we aren't careful. We will leave it for this prototype.
      }
    };
  }, []);

  const handleRun = async () => {
    if (!workspaceRef.current || isRunning) return;
    
    setIsRunning(true);
    const commands = generateCommands(workspaceRef.current);
    
    for (const cmd of commands) {
      CommandDispatcher.dispatch(cmd);
      // Add a small delay between commands for visual effect if desired, 
      // though the prompt implies immediate dispatch. For animations, we might want to wait,
      // but for state it should be immediate. Let's just dispatch them sequentially with a small delay.
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          Workspace
        </h2>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
            isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 shadow hover:shadow-md'
          }`}
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
      <div className="flex-1 relative">
        <div ref={blocklyDiv} className="absolute inset-0" />
      </div>
    </div>
  );
};
