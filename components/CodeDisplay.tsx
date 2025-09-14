
import React, { useState, useEffect } from 'react';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';

interface CodeDisplayProps {
  code: string;
  isStreaming: boolean;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, isStreaming }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden h-full flex flex-col relative">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900/50">
        <p className="text-sm font-medium text-slate-400">Generated Code</p>
        <button
          onClick={handleCopy}
          className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-100"
          aria-label="Copy code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="p-4 text-sm whitespace-pre-wrap overflow-auto flex-grow font-mono">
        <code>
          {code}
          {isStreaming && <span className="inline-block w-2 h-4 bg-sky-400 animate-pulse ml-1" />}
        </code>
      </pre>
    </div>
  );
};

export default CodeDisplay;
