import React, { useState, useEffect, useRef } from 'react';
import { Content } from "@google/genai";
import CodeDisplay from './components/CodeDisplay';
import PromptHistory from './components/PromptHistory';
import PromptInput from './components/PromptInput';
import Assistant from './components/Assistant';
import { generateCodeStream, sendAssistantMessageStream } from './services/geminiService';
import type { CodeStep, ChatMessage } from './types';

const App: React.FC = () => {
  const [steps, setSteps] = useState<CodeStep[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationQueue, setRegenerationQueue] = useState<number[]>([]);

  const [assistantHistory, setAssistantHistory] = useState<ChatMessage[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const displayedCode = activeIndex >= 0 && steps[activeIndex] ? steps[activeIndex].code : '';
  
  useEffect(() => {
    // Clear assistant chat when the active step changes
    setAssistantHistory([]);
  }, [activeIndex]);

  useEffect(() => {
    if (regenerationQueue.length === 0 || isLoading) {
      return;
    }

    const startIndex = regenerationQueue[0];
    
    const regenerate = async () => {
      setIsLoading(true);
      setIsRegenerating(startIndex > 0 || stepsRef.current.length > 1);

      let lastSuccessfulCode = startIndex > 0 ? stepsRef.current[startIndex - 1].code : '';
      
      for (let i = startIndex; i < stepsRef.current.length; i++) {
        const currentStep = stepsRef.current[i];
        
        try {
          const stream = await generateCodeStream(lastSuccessfulCode, currentStep.prompt);
          let fullCode = '';
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              fullCode += text;
              setSteps(currentSteps => {
                const newSteps = [...currentSteps];
                if (newSteps[i]) {
                  newSteps[i].code = fullCode;
                }
                return newSteps;
              });
            }
          }
          lastSuccessfulCode = fullCode;
          setActiveIndex(i);
        } catch (error) {
          console.error(`Error regenerating step ${i}:`, error);
          setIsLoading(false);
          setIsRegenerating(false);
          setRegenerationQueue([]);
          return;
        }
      }
      
      setIsLoading(false);
      setIsRegenerating(false);
      setRegenerationQueue(q => q.slice(1));
    };

    regenerate();
  }, [regenerationQueue, isLoading]);

  const handleNewPromptSubmit = (prompt: string) => {
    const newStep: CodeStep = { id: `step-${Date.now()}-${Math.random()}`, prompt, code: '' };
    const newStepIndex = steps.length;
    setSteps(currentSteps => [...currentSteps, newStep]);
    setActiveIndex(newStepIndex);
    setRegenerationQueue(q => [...q, newStepIndex]);
  };

  const handleSelectStep = (index: number) => {
    if (!isLoading) {
      setActiveIndex(index);
    }
  };

  const handleEditStep = (index: number, newPrompt: string) => {
    setSteps(currentSteps => {
      const newSteps = [...currentSteps];
      if (newSteps[index].prompt !== newPrompt) {
        newSteps[index].prompt = newPrompt;
        for(let i = index; i < newSteps.length; i++) {
            newSteps[i].code = '';
        }
        setRegenerationQueue(q => [...q, index]);
      }
      return newSteps;
    });
  };
  
  const handleDeleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);

    if (newSteps.length === 0) {
      setActiveIndex(-1);
    } else {
      if (activeIndex >= index) {
        setActiveIndex(Math.max(0, index - 1)); 
      }
      if (index < newSteps.length) {
        setRegenerationQueue(q => [...q, index]);
      }
    }
  };

  const handleSendAssistantMessage = async (message: string, isInitialAnalysis: boolean = false) => {
    if (!displayedCode || isAssistantLoading) return;
    
    setIsAssistantLoading(true);

    const currentHistory = isInitialAnalysis ? [] : [...assistantHistory];
    
    setAssistantHistory([...currentHistory, { role: 'user', content: message }]);

    try {
      // Convert ChatMessage[] to Content[] for the API
      const apiHistory: Content[] = currentHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const stream = await sendAssistantMessageStream(displayedCode, message, apiHistory);
      
      let fullResponse = '';
      let responseStarted = false;

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          if (!responseStarted) {
            // Add the model's response entry to history
            setAssistantHistory(prev => [...prev, { role: 'model', content: fullResponse }]);
            responseStarted = true;
          } else {
            // Update the last model response in history
            setAssistantHistory(prev => {
              const newHistory = [...prev];
              newHistory[newHistory.length - 1].content = fullResponse;
              return newHistory;
            });
          }
        }
      }
    } catch (error) {
      const errorMessage = 'Sorry, an error occurred. Please try again.';
       setAssistantHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
      console.error('Assistant chat failed:', error);
    } finally {
      setIsAssistantLoading(false);
    }
  };


  return (
    <div className="h-screen w-screen p-4 flex flex-col gap-4 max-w-screen-2xl mx-auto">
      <header className="flex items-center gap-2">
         <h1 className="text-2xl font-bold text-slate-200">AI Co-Developer</h1>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow min-h-0">
        <div className="md:col-span-1 flex flex-col gap-4 min-h-0">
            <PromptHistory
                steps={steps}
                activeIndex={activeIndex}
                onSelectStep={handleSelectStep}
                onDeleteStep={handleDeleteStep}
                onEditStep={handleEditStep}
            />
        </div>
        <div className="md:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="flex-grow min-h-0">
             <CodeDisplay code={displayedCode} isStreaming={isLoading && !isRegenerating} />
          </div>
          <div>
            <PromptInput 
                onSubmit={handleNewPromptSubmit} 
                isLoading={isLoading}
                isRegenerating={isRegenerating}
            />
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col gap-4 min-h-0">
            <Assistant 
              codeToAnalyze={displayedCode}
              history={assistantHistory}
              isAnalyzing={isAssistantLoading}
              onSendMessage={handleSendAssistantMessage}
            />
        </div>
      </main>
    </div>
  );
};

export default App;
