/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface MultiAngleViewPanelProps {
  onGenerate: () => void;
  isLoading: boolean;
}

const MultiAngleViewPanel: React.FC<MultiAngleViewPanelProps> = ({ onGenerate, isLoading }) => {
  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 text-base font-bold text-center";

  return (
    <div className="w-full mt-6 bg-white/80 border-2 border-black p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-bold text-center text-gray-800">Step 2: Generate 360° View</h3>
      <p className="text-md text-gray-700 -mt-2 text-center">See your new outfit from every angle. The AI will generate 6 different views.</p>
      <button
        onClick={onGenerate}
        className={`${retroButtonClasses} w-full max-w-xs mt-2 py-4 px-6 bg-pink-500 text-white disabled:bg-pink-300`}
        disabled={isLoading}
      >
        Generate 360° Views
      </button>
    </div>
  );
};

export default MultiAngleViewPanel;
