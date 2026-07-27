import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  completed: boolean;
}

interface TaskPanelProps {
  story: string;
  tasks: Task[];
  hint: string;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ story, tasks, hint }) => {
  const allCompleted = tasks.length > 0 && tasks.every(t => t.completed);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Your Mission</h2>
        <p className="text-blue-100 text-sm leading-relaxed">{story}</p>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks</h3>
        <ul className="space-y-4">
          {tasks.map(task => (
            <li key={task.id} className="flex items-start gap-3">
              <div className={`mt-0.5 transition-colors duration-300 ${task.completed ? 'text-green-500' : 'text-gray-300'}`}>
                {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {task.description}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="text-amber-800 font-semibold text-sm mb-1">💡 Hint</h4>
          <p className="text-amber-700 text-sm">{hint}</p>
        </div>
      </div>

      {allCompleted && (
        <div className="p-6 bg-green-50 border-t border-green-100 transition-all duration-500 ease-in animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold">Mission Accomplished!</h4>
              <p className="text-sm opacity-90">Great job programming Timmy's state and behaviour.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
