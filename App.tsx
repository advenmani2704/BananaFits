/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateLayeredOutfit, generateVariations, generateSceneFromImage, generateCaptions, refineImage, generateAnimeTransformation, generateMultiAngleViews } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import TryOnPanel, { ClothingItem } from './components/TryOnPanel';
import ContextPanel from './components/ContextPanel';
import AnimePanel from './components/AnimePanel';
import ResultsDisplay from './components/ResultsDisplay';
import RefinementModal from './components/RefinementModal';
import { UndoIcon, RedoIcon, EyeIcon, BullseyeIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import LandingPage from './components/LandingPage';
import MultiAngleViewPanel from './components/MultiAngleViewPanel';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const App: React.FC = () => {
  const [appStarted, setAppStarted] = useState<boolean>(false);
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // New state for the multi-step workflow
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [activeClothingItemId, setActiveClothingItemId] = useState<number|null>(null);
  const [variationResults, setVariationResults] = useState<{images: string[], captions: string[]}|null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('AI is working its magic...');
  const [isOutfitApplied, setIsOutfitApplied] = useState<boolean>(false);

  // State for post-generation refinement
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementState, setRefinementState] = useState<{
      isOpen: boolean;
      imageIndex: number | null;
      imageSrc: string | null;
      caption: string | null;
  }>({ isOpen: false, imageIndex: null, imageSrc: null, caption: null });


  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setClothingItems([]);
    setActiveClothingItemId(null);
    setDisplayHotspot(null);
    setVariationResults(null);
    setIsOutfitApplied(false);
  }, []);

  const handleLandingPageUpload = useCallback((file: File) => {
    handleImageUpload(file);
    setAppStarted(true);
  }, [handleImageUpload]);
  
  const handleApplyOutfit = useCallback(async (items: ClothingItem[]) => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    const itemsToApply = items.filter(item => (item.value && item.hotspot));
    if (itemsToApply.length === 0) {
        setError('Please add and place at least one clothing item to apply.');
        return;
    }

    setIsLoading(true);
    setLoadingMessage('AI is applying the new outfit...');
    setError(null);

    try {
        const editedImageUrl = await generateLayeredOutfit(currentImage, itemsToApply);

        const newImageFile = dataURLtoFile(editedImageUrl, `outfit-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setIsOutfitApplied(true);
        setDisplayHotspot(null);
        setActiveClothingItemId(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the outfit. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
        setLoadingMessage('AI is working its magic...');
    }
  }, [currentImage, addImageToHistory]);

    const handleConfirmOutfit = useCallback(() => {
        setClothingItems([]);
        setIsOutfitApplied(false);
    }, []);

  const handleGenerate = useCallback(async (source: string[] | File) => {
      if (!currentImage) {
          setError('No image available to generate variations.');
          return;
      }

      setIsLoading(true);
      setLoadingMessage('Generating AI photoshoot (this may take a minute)...');
      setError(null);

      try {
          let images: string[];
          let contextsForCaptions: string[];
          const clothingPrompt = clothingItems.map(i => typeof i.value === 'string' ? i.value : i.type).join(', ');

          if (Array.isArray(source)) {
              images = await generateVariations(currentImage, source);
              contextsForCaptions = source;
          } else {
              images = await generateSceneFromImage(currentImage, source);
              contextsForCaptions = ['the user-provided background']; // Generic context for captioning
          }
          
          const captions = await generateCaptions(clothingPrompt, contextsForCaptions);
          
          setVariationResults({ images, captions });
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(`Failed to generate variations. ${errorMessage}`);
          console.error(err);
      } finally {
          setIsLoading(false);
          setLoadingMessage('AI is working its magic...');
      }
  }, [currentImage, clothingItems]);

  const handleGenerateMultiAngleViews = useCallback(async () => {
    if (!currentImage) {
        setError('No image available to generate views.');
        return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating 360° views (this may take a minute)...');
    setError(null);

    try {
        const { images, captions } = await generateMultiAngleViews(currentImage);
        setVariationResults({ images, captions });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate multi-angle views. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
        setLoadingMessage('AI is working its magic...');
    }
  }, [currentImage]);

  const handleGenerateAnime = useCallback(async (panelImage: File, posePrompt: string) => {
    if (!currentImage) {
        setError('No image available to transform.');
        return;
    }

    setIsLoading(true);
    setLoadingMessage('Performing Anime Transformation (this may take a minute)...');
    setError(null);

    try {
        const resultUrl = await generateAnimeTransformation(currentImage, panelImage, posePrompt);
        const captions = [
            "Here is your anime transformation!",
            "Welcome to the 2D world! ✨",
            "Character unlocked. #AnimeMe",
            "Just dropped into my favorite anime."
        ];
        
        setVariationResults({ images: [resultUrl], captions });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate anime transformation. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
        setLoadingMessage('AI is working its magic...');
    }
}, [currentImage]);

    const handleOpenRefinementModal = (imageIndex: number) => {
        if (variationResults) {
            setRefinementState({
                isOpen: true,
                imageIndex,
                imageSrc: variationResults.images[imageIndex],
                caption: variationResults.captions[0] || "Here's one of the looks!", // Use first caption as context
            });
        }
    };

    const handleCloseRefinementModal = () => {
        if (!isRefining) {
            setRefinementState({ isOpen: false, imageIndex: null, imageSrc: null, caption: null });
        }
    };

    const handleRefineRequest = async (prompt: string) => {
        if (refinementState.imageIndex === null || !refinementState.imageSrc || !refinementState.caption || !variationResults) {
            setError("Cannot perform refinement, required data is missing.");
            return;
        }
        if (!prompt.trim()) {
            setError("Please provide instructions for the refinement.");
            return;
        }

        setIsRefining(true);
        setError(null);

        try {
            const imageFile = dataURLtoFile(refinementState.imageSrc, `refine-target-${refinementState.imageIndex}.png`);
            const refinedImageUrl = await refineImage(imageFile, prompt);
            
            const newImages = [...variationResults.images];
            newImages[refinementState.imageIndex] = refinedImageUrl;
            setVariationResults({ ...variationResults, images: newImages });

            handleCloseRefinementModal();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to refine the image. ${errorMessage}`);
            console.error(err);
        } finally {
            setIsRefining(false);
        }
    };

  const handleSelectVariation = useCallback(async (imageIndex: number) => {
        if (!variationResults) return;

        setIsLoading(true);
        setLoadingMessage('Setting up the new scene...');
        
        try {
            const selectedImageUrl = variationResults.images[imageIndex];
            const newImageFile = dataURLtoFile(selectedImageUrl, `variation-${Date.now()}.png`);
            
            addImageToHistory(newImageFile);
            
            setVariationResults(null);
            setClothingItems([]);
            setActiveClothingItemId(null);
            setDisplayHotspot(null);
            setIsOutfitApplied(false);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to process the selected image. ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('AI is working its magic...');
        }
    }, [variationResults, addImageToHistory]);

    const handleDiscardVariations = useCallback(() => {
        setVariationResults(null);
    }, []);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setDisplayHotspot(null);
      setIsOutfitApplied(false);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setDisplayHotspot(null);
      setIsOutfitApplied(false);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setDisplayHotspot(null);
      setIsOutfitApplied(false);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setClothingItems([]);
      setActiveClothingItemId(null);
      setDisplayHotspot(null);
      setVariationResults(null);
      setIsOutfitApplied(false);
      setAppStarted(false); // Return to landing page
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeClothingItemId === null) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setClothingItems(prevItems =>
        prevItems.map(item =>
            item.id === activeClothingItemId ? { ...item, hotspot: { x: originalX, y: originalY } } : item
        )
    );
    setActiveClothingItemId(null);
};

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-100 border-2 border-red-500 p-8 max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
            <p className="text-md text-red-800">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 text-md transition-colors border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
              >
                Try Again
            </button>
          </div>
        );
    }

    if (variationResults) {
        return <ResultsDisplay 
            images={variationResults.images} 
            captions={variationResults.captions} 
            onSelectImage={handleSelectVariation}
            onTryAgain={handleDiscardVariations}
            onStartOver={handleUploadNew} 
            onRefineImage={handleOpenRefinementModal} 
        />;
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }
    
    const retroButtonClasses = "border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 text-base font-bold flex items-center justify-center text-center py-3 px-5";
    const isPlacingItem = activeClothingItemId !== null;

    const imageDisplay = (
      <div className="relative">
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className="w-full h-auto object-contain max-h-[60vh] pointer-events-none"
            />
        )}
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="Current"
            onClick={handleImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${isPlacingItem ? 'cursor-crosshair' : ''}`}
        />
      </div>
    );

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full border-4 border-black bg-gray-200 p-2">
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner className="text-teal-500"/>
                    <p className="text-teal-700 font-bold">{loadingMessage}</p>
                </div>
            )}
            
            {isPlacingItem && !isLoading && (
                <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center animate-fade-in pointer-events-none">
                    <p className="text-white text-xl font-bold bg-black/50 p-4 rounded-md border-2 border-white">
                        Click on the person to place the {clothingItems.find(i => i.id === activeClothingItemId)?.type || 'item'}.
                    </p>
                </div>
            )}

            {imageDisplay}

            {displayHotspot && !isLoading && !isPlacingItem && (
                <BullseyeIcon
                    className="absolute w-8 h-8 text-orange-500 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] animate-pulse"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                />
            )}
        </div>
        
        <div className="w-full">
            <TryOnPanel 
                items={clothingItems}
                setItems={setClothingItems}
                onApplyOutfit={handleApplyOutfit}
                isLoading={isLoading}
                activeItemId={activeClothingItemId}
                setActiveItemId={setActiveClothingItemId}
                isOutfitApplied={isOutfitApplied}
                onConfirmOutfit={handleConfirmOutfit}
            />
        </div>

        <div className="w-full">
            <MultiAngleViewPanel onGenerate={handleGenerateMultiAngleViews} isLoading={isLoading} />
        </div>

        <div className="w-full">
            <ContextPanel onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        <div className="w-full">
            <AnimePanel onGenerate={handleGenerateAnime} isLoading={isLoading} />
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className={`${retroButtonClasses} bg-gray-200 text-black`}
                aria-label="Undo last action"
            >
                <UndoIcon className="w-5 h-5 mr-2" />
                Undo
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className={`${retroButtonClasses} bg-gray-200 text-black`}
                aria-label="Redo last action"
            >
                <RedoIcon className="w-5 h-5 mr-2" />
                Redo
            </button>
            
            <div className="h-6 w-px bg-black mx-1 hidden sm:block"></div>

            {canUndo && (
              <button 
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className={`${retroButtonClasses} bg-yellow-300 text-black`}
                  aria-label="Press and hold to see original image"
              >
                  <EyeIcon className="w-5 h-5 mr-2" />
                  Compare
              </button>
            )}

            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className={`${retroButtonClasses} bg-gray-200 text-black disabled:bg-gray-100`}
              >
                Reset
            </button>
            <button 
                onClick={handleUploadNew}
                className={`${retroButtonClasses} bg-gray-200 text-black`}
            >
                Upload New
            </button>

            <button 
                onClick={handleDownload}
                className={`${retroButtonClasses} flex-grow sm:flex-grow-0 ml-auto bg-teal-400 text-black`}
            >
                Download Image
            </button>
        </div>
      </div>
    );
  };
  
  if (!appStarted) {
      return <LandingPage onFileSelect={handleLandingPageUpload} />;
  }

  return (
    <div className="min-h-screen text-gray-900 flex flex-col font-sans bg-off-white">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage || variationResults ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
      <RefinementModal
        isOpen={refinementState.isOpen}
        onClose={handleCloseRefinementModal}
        imageSrc={refinementState.imageSrc}
        caption={refinementState.caption}
        onRefine={handleRefineRequest}
        isLoading={isRefining}
      />
    </div>
  );
};

export default App;