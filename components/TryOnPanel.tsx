/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon, TrashIcon } from './icons';

// Define clothing categories
const CLOTHING_CATEGORIES = ['Top', 'Outerwear', 'Bottoms', 'Shoes', 'Hat', 'Sunglasses'] as const;
type ClothingCategory = typeof CLOTHING_CATEGORIES[number];

// Define the structure for a single clothing item
export interface ClothingItem {
  id: number;
  type: ClothingCategory;
  source: 'upload' | 'prompt';
  value: File | string | null;
  hotspot: { x: number, y: number } | null;
}

interface TryOnPanelProps {
  items: ClothingItem[];
  setItems: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
  onApplyOutfit: (items: ClothingItem[]) => void;
  isLoading: boolean;
  activeItemId: number | null;
  setActiveItemId: React.Dispatch<React.SetStateAction<number | null>>;
  isOutfitApplied: boolean;
  onConfirmOutfit: () => void;
}

// Sub-component for managing a single clothing item
const ClothingItemCard: React.FC<{
  item: ClothingItem;
  onUpdate: (update: Partial<ClothingItem>) => void;
  onDelete: () => void;
  onPlace: () => void;
  isActive: boolean;
  isDisabled: boolean;
}> = ({ item, onUpdate, onDelete, onPlace, isActive, isDisabled }) => {
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item.source === 'upload' && item.value instanceof File) {
      const url = URL.createObjectURL(item.value);
      setGarmentPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setGarmentPreviewUrl(null);
  }, [item.value, item.source]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpdate({ value: e.target.files[0] });
    }
  };

  const statusText = isActive ? 'Placing...' : item.hotspot ? 'Placed' : 'Needs Placement';
  const statusColor = isActive ? 'text-blue-600' : item.hotspot ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`p-3 border-2 border-black bg-white transition-all ${isActive ? 'ring-2 ring-blue-500' : ''} ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-lg">{item.type}</h4>
        <div className="flex items-center gap-4">
          <span className={`font-bold text-sm ${statusColor}`}>{statusText}</span>
          <button onClick={onDelete} disabled={isDisabled} className="text-gray-500 hover:text-red-500 disabled:opacity-50">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-gray-200 border border-black p-1 flex items-center justify-center gap-1 mb-2">
        {(['upload', 'prompt'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onUpdate({ source: mode, value: null })}
            className={`w-full capitalize font-semibold py-1 px-2 transition-all duration-200 text-xs ${item.source === mode ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-300'}`}
            disabled={isDisabled}
          >
            {mode}
          </button>
        ))}
      </div>

      {item.source === 'upload' ? (
        <>
          <input type="file" id={`garment-upload-${item.id}`} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isDisabled} />
          <label htmlFor={`garment-upload-${item.id}`} className={`relative w-full h-24 bg-gray-100 flex items-center justify-center transition-colors border-2 border-dashed border-gray-400 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-gray-600'}`}>
            {garmentPreviewUrl ? (
              <img src={garmentPreviewUrl} alt="Garment" className="w-full h-full object-contain p-1" />
            ) : (
              <div className="text-center text-gray-500">
                <UploadIcon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs font-semibold">Upload Image</p>
              </div>
            )}
          </label>
        </>
      ) : (
        <textarea
          value={typeof item.value === 'string' ? item.value : ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={`e.g., 'a blue ${item.type.toLowerCase()}'`}
          className="h-24 bg-white border-2 border-black p-2 text-sm w-full resize-none disabled:opacity-60"
          disabled={isDisabled}
        />
      )}
      <button onClick={onPlace} disabled={isDisabled} className="w-full mt-2 bg-gray-200 text-black font-semibold py-2 text-sm border border-black hover:bg-gray-300 disabled:opacity-50">
        {item.hotspot ? 'Reposition' : 'Set Position'}
      </button>
    </div>
  );
};


const TryOnPanel: React.FC<TryOnPanelProps> = ({ items, setItems, onApplyOutfit, isLoading, activeItemId, setActiveItemId, isOutfitApplied, onConfirmOutfit }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  const handleAddItem = (type: ClothingCategory) => {
    const newItem: ClothingItem = {
      id: Date.now(),
      type,
      source: 'upload',
      value: null,
      hotspot: null,
    };
    setItems(prev => [...prev, newItem]);
    setShowAddMenu(false);
  };

  const handleUpdateItem = (id: number, update: Partial<ClothingItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...update } : item));
  };
  
  const handleDeleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  const handlePlaceItem = (id: number) => {
    setActiveItemId(id);
  };
  
  const isApplyDisabled = isLoading || items.length === 0 || items.some(item => !item.value || !item.hotspot);
  const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 text-base font-bold text-center";

  return (
    <div className="w-full bg-white/80 border-2 border-black p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-bold text-center text-gray-800">Step 1: Build Your Outfit</h3>
      
      {isOutfitApplied && (
        <div className="w-full max-w-xl p-4 my-2 bg-teal-50 border-2 border-teal-500 text-center animate-fade-in">
          <p className="font-bold text-teal-800">Outfit Applied Successfully!</p>
          <p className="text-sm text-teal-700 mt-1">Confirm this new look to add more clothing, or undo to make changes.</p>
          <button
            onClick={onConfirmOutfit}
            className={`${retroButtonClasses} w-full mt-4 py-3 px-6 bg-teal-500 text-white`}
          >
            Confirm & Add More
          </button>
        </div>
      )}

      <div className="w-full max-w-xl flex flex-col gap-3">
        {items.length === 0 && !isOutfitApplied && <p className="text-center text-gray-600">Add a clothing item to get started.</p>}
        {items.map(item => (
          <ClothingItemCard
            key={item.id}
            item={item}
            onUpdate={(update) => handleUpdateItem(item.id, update)}
            onDelete={() => handleDeleteItem(item.id)}
            onPlace={() => handlePlaceItem(item.id)}
            isActive={activeItemId === item.id}
            isDisabled={isLoading || isOutfitApplied}
          />
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          disabled={isLoading || isOutfitApplied}
          className={`${retroButtonClasses} bg-gray-200 text-black px-6 py-3`}
        >
          + Add Clothing Item
        </button>
        {showAddMenu && (
          <div className="absolute bottom-full mb-2 w-full bg-white border-2 border-black z-10 flex flex-col">
            {CLOTHING_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => handleAddItem(category)}
                className="text-left p-3 hover:bg-gray-200 font-semibold"
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onApplyOutfit(items)}
        className={`${retroButtonClasses} w-full max-w-xs mt-4 py-4 px-6 bg-orange-500 text-white disabled:bg-orange-300`}
        disabled={isApplyDisabled || isOutfitApplied}
      >
        Apply Outfit
      </button>
    </div>
  );
};

export default TryOnPanel;