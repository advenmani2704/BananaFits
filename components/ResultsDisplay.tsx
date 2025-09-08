/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { UploadIcon } from './icons';

interface ResultsDisplayProps {
  images: string[];
  captions: string[];
  onSelectImage: (index: number) => void;
  onTryAgain: () => void;
  onStartOver: () => void;
  onRefineImage: (index: number) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images, captions, onSelectImage, onTryAgain, onStartOver, onRefineImage }) => {
  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 font-bold flex items-center justify-center text-center";

  const isSingleImage = images.length === 1;

  const gridContainerClasses = isSingleImage 
    ? "w-full max-w-2xl" 
    : `grid grid-cols-1 sm:grid-cols-2 ${images.length > 4 ? 'lg:grid-cols-3' : 'md:grid-cols-4'} gap-4 w-full`;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 text-center">Your AI Photoshoot is Ready!</h1>
      <p className="text-lg text-gray-700 -mt-4 text-center">Select your favorite look to continue editing, or try generating a new scene.</p>
      
      <div className={gridContainerClasses}>
        {images.map((imgSrc, index) => (
          <div 
            key={index} 
            className="bg-white p-1 border-2 border-black animate-fade-in group transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_#000] flex flex-col" 
            style={{animationDelay: `${index * 100}ms`}}
          >
            <img 
              src={imgSrc} 
              alt={`Variation ${index + 1}`} 
              className="w-full h-auto object-cover cursor-pointer"
              onClick={() => onSelectImage(index)}
            />
             <div className="p-2 flex flex-col gap-2 mt-auto">
                <button 
                    onClick={() => onSelectImage(index)}
                    className="w-full bg-teal-500 text-white font-bold py-2 px-3 text-center border-2 border-black text-sm transition-all hover:bg-teal-600 active:scale-95"
                >
                    Select This Look
                </button>
                <button 
                    onClick={() => onRefineImage(index)}
                    className="w-full bg-gray-200 text-black font-semibold py-1 px-3 text-center border border-black text-xs transition-all hover:bg-gray-300 active:scale-95"
                >
                    Refine Pose/Expression
                </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="w-full max-w-3xl bg-white border-2 border-black p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-orange-600">Instagram Caption Ideas</h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          {captions.map((caption, index) => (
            <li key={index}>{caption}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
        <button
            onClick={onTryAgain}
            className={`${retroButtonClasses} bg-gray-200 text-black px-8 py-4 text-lg`}
        >
            Go Back & Try Again
        </button>
        <button
          onClick={onStartOver}
          className={`${retroButtonClasses} bg-orange-500 text-white px-8 py-4 text-lg`}
        >
          <UploadIcon className="w-6 h-6 mr-3" />
          Start a New Project
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;