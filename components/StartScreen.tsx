/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };
  
  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 font-bold flex items-center justify-center text-center";

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 border-2 ${isDraggingOver ? 'bg-orange-200/50 border-dashed border-black' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
          AI-Powered Virtual Try-On, <span className="text-orange-600">Instantly</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-700 md:text-xl">
          Upload a photo of yourself, then either add a garment image or describe any clothing with a text prompt to see how it looks.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className={`${retroButtonClasses} relative inline-flex px-10 py-5 text-xl bg-orange-500 text-white cursor-pointer group hover:bg-orange-600`}>
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                Upload Your Photo
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500">or drag and drop a file</p>
        </div>

        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="bg-white p-6 border-2 border-black flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mb-4 border border-black">
                       <UploadIcon className="w-6 h-6 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Upload Garment</h3>
                    <p className="mt-2 text-gray-700">Have a picture of a clothing item? Upload it and see a realistic preview of it on your photo.</p>
                </div>
                <div className="bg-white p-6 border-2 border-black flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mb-4 border border-black">
                       <MagicWandIcon className="w-6 h-6 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Describe with AI</h3>
                    <p className="mt-2 text-gray-700">Imagine any outfit. Describe it with text, and our AI will generate it for you to try on virtually.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;