import React, { useState, FormEvent, KeyboardEvent } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  isRegenerating: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading, isRegenerating }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const buttonText = () => {
    if (isRegenerating) return 'Regenerating...';
    if (isLoading) return 'Generating...';
    return 'Generate';
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-800/50 rounded-lg" aria-label="code generation prompt">
      <div className="flex items-start space-x-4">
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 'Create a python function to calculate fibonacci'"
          className="flex-grow bg-slate-900/70 text-slate-100 p-3 rounded-md text-sm border border-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none transition-shadow"
          rows={3}
          disabled={isLoading}
          aria-multiline="true"
          aria-label="Code instruction"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="px-6 py-3 h-full rounded-md bg-sky-600 text-white font-semibold hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
          aria-live="polite"
        >
          {buttonText()}
        </button>
      </div>
    </form>
  );
};

export default PromptInput;
