import React, { useState, FormEvent, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SendIcon from './icons/SendIcon';

interface AssistantProps {
  codeToAnalyze: string;
  history: ChatMessage[];
  isAnalyzing: boolean;
  onSendMessage: (message: string, isInitial: boolean) => void;
}

const Assistant: React.FC<AssistantProps> = ({ codeToAnalyze, history, isAnalyzing, onSendMessage }) => {
  const [prompt, setPrompt] = useState('');
  const hasCode = codeToAnalyze && codeToAnalyze.trim() !== '';
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleInitialAnalysis = () => {
    onSendMessage('Analyze this code. Provide a summary, point out potential issues, and give suggestions.', true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isAnalyzing) {
      onSendMessage(prompt.trim(), false);
      setPrompt('');
    }
  };

  const isModelStreaming = isAnalyzing && history.length > 0 && history[history.length - 1].role === 'model';

  return (
    <div className="bg-slate-800 rounded-lg h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
          <SparklesIcon className="text-sky-400" />
          AI Analyst
        </h2>
        <button
          onClick={handleInitialAnalysis}
          disabled={!hasCode || isAnalyzing}
          className="px-3 py-1 text-xs rounded-md bg-sky-600 text-white font-semibold hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 text-slate-300 text-sm mb-4">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-slate-500">
            <p>{hasCode ? 'Click "Analyze Code" to get started.' : 'Select a step with code to enable analysis.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-800/70 text-sky-100' : 'bg-slate-700/50'}`}>
                  <pre className="whitespace-pre-wrap font-sans">
                    {msg.content}
                    {isModelStreaming && index === history.length - 1 && <span className="inline-block w-2 h-4 bg-sky-400 animate-pulse ml-1" />}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
         <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex-shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={history.length > 0 ? "Ask a follow-up question..." : "Click Analyze Code first"}
            className="flex-grow bg-slate-900/70 text-slate-100 p-2 rounded-md text-sm border border-slate-700 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-shadow"
            disabled={isAnalyzing || !hasCode || history.length === 0}
            aria-label="Ask assistant a question"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !prompt.trim() || !hasCode || history.length === 0}
            className="p-2 rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Assistant;
