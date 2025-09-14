import React, { useState, useRef, useEffect } from 'react';
import type { CodeStep } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface PromptHistoryProps {
  steps: CodeStep[];
  activeIndex: number;
  onSelectStep: (index: number) => void;
  onDeleteStep: (index: number) => void;
  onEditStep: (index: number, newPrompt: string) => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({
  steps,
  activeIndex,
  onSelectStep,
  onDeleteStep,
  onEditStep,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when a new step is added
    if (steps.length > 0) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps.length]);

  const handleEditStart = (index: number, prompt: string) => {
    setEditingIndex(index);
    setEditText(prompt);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleEditSave = (index: number) => {
    if (editText.trim()) {
      onEditStep(index, editText.trim());
    }
    setEditingIndex(null);
    setEditText('');
  };

  return (
    <div className="bg-slate-800 rounded-lg h-full flex flex-col p-4">
      <h2 className="text-lg font-bold mb-4 text-slate-300">History</h2>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {steps.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-slate-500">
            <p>Your coding journey starts here. <br/> Enter your first instruction below.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.id}>
                {editingIndex === index ? (
                  <div className="p-3 rounded-lg bg-slate-700">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-slate-900 text-slate-100 p-2 rounded-md text-sm border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <button onClick={handleEditCancel} className="text-xs px-2 py-1 rounded bg-slate-600 hover:bg-slate-500">Cancel</button>
                      <button onClick={() => handleEditSave(index)} className="text-xs px-2 py-1 rounded bg-sky-600 hover:bg-sky-500">Save & Regenerate</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => onSelectStep(index)}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                      activeIndex === index ? 'bg-sky-900/50 ring-1 ring-sky-700' : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                       <p className="text-sm text-slate-300 flex-grow pr-2 break-words">
                        <span className="font-bold text-slate-400 mr-2">{index + 1}.</span>
                        {step.prompt}
                      </p>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditStart(index, step.prompt); }} className="p-1 rounded-full hover:bg-slate-600 text-slate-400 hover:text-sky-400"><EditIcon /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteStep(index); }} className="p-1 rounded-full hover:bg-slate-600 text-slate-400 hover:text-red-400"><TrashIcon /></button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
            <div ref={historyEndRef} />
          </ul>
        )}
      </div>
    </div>
  );
};

export default PromptHistory;
