/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import Spinner from './Spinner';

interface RefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  caption: string | null;
  onRefine: (prompt: string) => void;
  isLoading: boolean;
}

const RefinementModal: React.FC<RefinementModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  caption,
  onRefine,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState('');
  
  if (!isOpen || !imageSrc) return null;
  
  const handleRefineClick = () => {
    if (prompt.trim()) {
      onRefine(prompt.trim());
    }
  };

  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 text-base font-bold text-center py-3 px-5";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#F8F4E6] border-4 border-black w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row gap-6 p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
            <div className="absolute inset-0 bg-[#F8F4E6]/80 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                <Spinner className="text-teal-500"/>
                <p className="text-teal-700 font-bold">Refining the image...</p>
            </div>
        )}

        <div className="md:w-1/2 flex-shrink-0 border-2 border-black bg-gray-200 p-1">
          <img
            src={imageSrc}
            alt="Image to refine"
            className="w-full h-auto object-contain"
          />
        </div>

        <div className="md:w-1/2 flex flex-col justify-center gap-4">
          <h2 className="text-2xl font-bold text-orange-600">Refine Your Image</h2>
          <p className="text-gray-700 italic border-l-4 border-black pl-4">
            Context: "{caption || 'No caption available.'}"
          </p>
          <p className="text-gray-800">
            Describe the change you want to make.
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'make them smile' or 'adjust the pose to be more relaxed'"
            className="h-24 flex-grow bg-white border-2 border-black text-gray-900 p-4 text-base focus:ring-2 focus:ring-teal-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 resize-none"
            disabled={isLoading}
          />
          
          <button
              onClick={handleRefineClick}
              disabled={isLoading || !prompt.trim()}
              className={`${retroButtonClasses} w-full bg-teal-400 text-black`}
            >
              Apply Refinement
            </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full mt-2 bg-transparent border-2 border-black text-black font-semibold py-2 px-4 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefinementModal;