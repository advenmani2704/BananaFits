/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons';

interface AnimePanelProps {
  onGenerate: (panelImage: File, posePrompt: string) => void;
  isLoading: boolean;
}

const AnimePanel: React.FC<AnimePanelProps> = ({ onGenerate, isLoading }) => {
  const [panelImage, setPanelImage] = useState<File | null>(null);
  const [posePrompt, setPosePrompt] = useState<string>('');
  const [panelPreview, setPanelPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    if (panelImage) {
      const url = URL.createObjectURL(panelImage);
      setPanelPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPanelPreview(null);
  }, [panelImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPanelImage(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPanelImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingOver(false); }, []);

  const handleGenerateClick = () => {
    if (panelImage && posePrompt) {
      onGenerate(panelImage, posePrompt);
    }
  };

  const isGenerateDisabled = isLoading || !panelImage || !posePrompt.trim();
  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 text-base font-bold text-center";

  return (
    <div className="w-full mt-6 bg-white/80 border-2 border-black p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-bold text-center text-gray-800">Alternative: Anime Transformation</h3>
      <p className="text-md text-gray-700 -mt-2 text-center">Transform yourself into an anime character that matches the style of an existing anime panel.</p>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-2">
            <h4 className="font-bold text-center">1. Upload Anime Panel</h4>
            <input type="file" id="panel-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
            <label
              htmlFor="panel-upload"
              className={`relative w-full h-48 bg-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 transition-colors border-2 border-dashed ${isDraggingOver ? 'border-orange-400 bg-orange-100' : 'border-gray-500'}`}
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            >
              {panelPreview ? (
                <img src={panelPreview} alt="Anime panel preview" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center text-gray-600">
                  <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Upload Panel Image</p>
                  <p className="text-xs">Click or drag & drop</p>
                </div>
              )}
            </label>
        </div>
        <div className="flex flex-col gap-2">
            <h4 className="font-bold text-center">2. Describe Pose</h4>
            <textarea
              value={posePrompt}
              onChange={(e) => setPosePrompt(e.target.value)}
              placeholder="e.g., 'standing confidently with arms crossed' or 'looking surprised and pointing'"
              className="h-48 bg-white border-2 border-black text-gray-900 p-4 text-base focus:ring-2 focus:ring-teal-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 resize-none"
              disabled={isLoading}
            />
        </div>
      </div>

      <button
        onClick={handleGenerateClick}
        className={`${retroButtonClasses} w-full max-w-xs mt-2 py-4 px-6 bg-purple-500 text-white disabled:bg-purple-300`}
        disabled={isGenerateDisabled}
      >
        Generate Transformation
      </button>
    </div>
  );
};

export default AnimePanel;
