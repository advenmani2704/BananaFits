/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons';

interface ContextPanelProps {
  onGenerate: (source: string[] | File) => void;
  isLoading: boolean;
}

type GenerationMode = 'prompt' | 'upload';

const DEFAULT_CONTEXTS = ['a vibrant party', 'a modern classroom', 'in front of the Eiffel Tower', 'a professional conference', 'a serene temple'];

const ContextPanel: React.FC<ContextPanelProps> = ({ onGenerate, isLoading }) => {
  const [mode, setMode] = useState<GenerationMode>('prompt');
  const [customContexts, setCustomContexts] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    if (backgroundImage) {
      const url = URL.createObjectURL(backgroundImage);
      setBackgroundPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setBackgroundPreview(null);
  }, [backgroundImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackgroundImage(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setBackgroundImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingOver(false); }, []);

  const handleGenerateClick = () => {
    if (mode === 'upload' && backgroundImage) {
      onGenerate(backgroundImage);
    } else {
      const contexts = customContexts
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      const finalContexts = contexts.length > 0 ? contexts : DEFAULT_CONTEXTS;
      // The generation service expects exactly 4 contexts for text-based variations
      onGenerate(finalContexts.slice(0, 4));
    }
  };
  
  const addDefaultContext = (context: string) => {
    setCustomContexts(prev => prev ? `${prev}, ${context}` : context);
  };

  const isGenerateDisabled = isLoading || (mode === 'upload' && !backgroundImage);
  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 text-base font-bold text-center";

  return (
    <div className="w-full mt-6 bg-white/80 border-2 border-black p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-bold text-center text-gray-800">Step 3: Generate AI Photoshoot</h3>
      <p className="text-md text-gray-700 -mt-2 text-center">Place the person in a new scene by describing it or uploading a background.</p>

       <div className="w-full max-w-sm bg-gray-200 border border-black p-1 flex items-center justify-center gap-1">
        {(['prompt', 'upload'] as GenerationMode[]).map(tabMode => (
            <button
              key={tabMode}
              onClick={() => setMode(tabMode)}
              className={`w-full capitalize font-semibold py-2 px-4 transition-all duration-200 text-sm ${
                  mode === tabMode 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:text-black hover:bg-gray-300'
              }`}
            >
              {tabMode === 'prompt' ? 'Describe Scene' : 'Upload Background'}
            </button>
        ))}
      </div>

      <div className="w-full max-w-2xl">
        {mode === 'prompt' ? (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <input
              type="text"
              value={customContexts}
              onChange={(e) => setCustomContexts(e.target.value)}
              placeholder="Enter 4 contexts, separated by commas..."
              className="flex-grow bg-white border-2 border-black text-gray-900 p-4 focus:ring-2 focus:ring-teal-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-600 -mt-3">Leave blank to use defaults.</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Suggestions:</span>
              {DEFAULT_CONTEXTS.map(context => (
                <button
                  key={context}
                  onClick={() => addDefaultContext(context)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 bg-gray-200 hover:bg-gray-300 text-gray-800 border border-black"
                >
                  {context}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <input type="file" id="background-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
            <label
              htmlFor="background-upload"
              className={`relative w-full h-48 bg-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 transition-colors border-2 border-dashed ${isDraggingOver ? 'border-orange-400 bg-orange-100' : 'border-gray-500'}`}
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            >
              {backgroundPreview ? (
                <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center text-gray-600">
                  <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Upload Background Image</p>
                  <p className="text-xs">Click or drag & drop</p>
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerateClick}
        className={`${retroButtonClasses} w-full max-w-xs mt-2 py-4 px-6 bg-teal-400 text-black disabled:bg-teal-200`}
        disabled={isGenerateDisabled}
      >
        Generate Scene &amp; Captions
      </button>
    </div>
  );
};

export default ContextPanel;