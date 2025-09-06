/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ClothingItem } from "../components/TryOnPanel";

// Helper function to convert an image file to PNG format if it's not a standard supported type.
const convertImageToPNG = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                image.src = e.target.result;
            } else {
                reject(new Error('FileReader did not return a string.'));
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to get canvas context'));
            }
            ctx.drawImage(image, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas to Blob conversion failed'));
                }
                const newFileName = (file.name.split('.').slice(0, -1).join('.') || file.name) + '.png';
                const newFile = new File([blob], newFileName, { type: 'image/png' });
                resolve(newFile);
            }, 'image/png');
        };
        image.onerror = () => reject(new Error('Image failed to load for conversion.'));
    });
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    
    let processedFile = file;

    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        console.warn(`Unsupported MIME type: ${file.type}. Attempting conversion to PNG.`);
        try {
            processedFile = await convertImageToPNG(file);
        } catch (error) {
            console.error('Image conversion failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during conversion.';
            throw new Error(`The file format (${file.type}) is not supported and could not be converted. ${errorMessage}`);
        }
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(processedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * DEPRECATED: Use generateLayeredOutfit instead.
 * Generates an image with a garment from a second image placed on a person in the first.
 */
export const generateTryOnImage = async (
    originalImage: File,
    garmentImage: File,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.warn("generateTryOnImage is deprecated. Use generateLayeredOutfit.");
    const item: ClothingItem = { id: 1, type: 'Top', source: 'upload', value: garmentImage, hotspot };
    return generateLayeredOutfit(originalImage, [item]);
};

/**
 * DEPRECATED: Use generateLayeredOutfit instead.
 * Generates an image with a garment from a text prompt placed on a person.
 */
export const generateClothingFromPrompt = async (
    originalImage: File,
    clothingPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.warn("generateClothingFromPrompt is deprecated. Use generateLayeredOutfit.");
    const item: ClothingItem = { id: 1, type: 'Top', source: 'prompt', value: clothingPrompt, hotspot };
    return generateLayeredOutfit(originalImage, [item]);
};


/**
 * Generates an image with a layered outfit composed of multiple items.
 * @param originalImage The image of the person.
 * @param items An array of ClothingItem objects describing the outfit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateLayeredOutfit = async (
    originalImage: File,
    items: ClothingItem[]
): Promise<string> => {
    console.log(`Starting layered virtual try-on with ${items.length} items.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    const garmentImageParts = [];
    const promptInstructions = [];
    let garmentImageCounter = 0;

    for (const item of items) {
        if (!item.hotspot) continue;

        if (item.source === 'upload' && item.value instanceof File) {
            garmentImageCounter++;
            garmentImageParts.push(await fileToPart(item.value));
            promptInstructions.push(
                `- A ${item.type} from garment image #${garmentImageCounter} should be placed on the person near coordinates (x: ${item.hotspot.x}, y: ${item.hotspot.y}).`
            );
        } else if (item.source === 'prompt' && typeof item.value === 'string' && item.value.trim()) {
            promptInstructions.push(
                `- A ${item.type} described as "${item.value}" should be placed on the person near coordinates (x: ${item.hotspot.x}, y: ${item.hotspot.y}).`
            );
        }
    }

    if (promptInstructions.length === 0) {
        throw new Error("No valid clothing items were provided to generate an outfit.");
    }
    
    const prompt = `You are an expert virtual stylist AI. The first image provided is the person to dress. The subsequent images are garments to be placed on them.

Instructions:
1.  Your task is to dress the person in the first image with a complete outfit described below.
2.  Accurately place each item onto the person based on its description and placement coordinates.
3.  Render all items realistically, matching the person's pose, body shape, and the lighting of the original photo.
4.  Crucially, you must layer the garments correctly and naturally (e.g., a jacket goes over a shirt).
5.  The rest of the image (background, and parts of the person not covered by the new outfit) must remain identical to the original.
6.  The new clothing should replace any existing clothing.

Outfit Details:
${promptInstructions.join('\n')}

Output: Return ONLY the final, single edited image. Do not return text.`;

    const textPart = { text: prompt };
    const allParts = [originalImagePart, ...garmentImageParts, textPart];
    
    console.log('Sending images and prompt to the model for layered try-on...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: allParts },
    });
    console.log('Received response from model for layered try-on.', response);
    
    return handleApiResponse(response, 'layered-outfit');
};

/**
 * Generates 4 contextual variations of a person from an image based on text prompts.
 * @param sourceImage The image of the person.
 * @param contexts An array of 4 text prompts describing the new scenes.
 * @returns A promise that resolves to an array of data URLs of the generated images.
 */
export const generateVariations = async (
    sourceImage: File,
    contexts: string[]
): Promise<string[]> => {
    console.log(`Generating variations for contexts:`, contexts);
    if (contexts.length < 1) {
        throw new Error("generateVariations requires at least 1 context string.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const sourceImagePart = await fileToPart(sourceImage);

    const generationPromises = contexts.map(async (context) => {
        const prompt = `INSTRUCTIONS:
1.  First, perfectly and cleanly isolate the main person from their original background. Remove all background elements.
2.  Next, place this isolated person into a new, realistic scene described as: "${context}".
3.  Ensure the lighting on the person is adjusted to perfectly match the new environment.
4.  Do not change the person, their pose, or their clothing in any way.
5.  The final output must be a photorealistic image.

OUTPUT: Return ONLY the final generated image.`;
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [sourceImagePart, textPart] },
        });

        return handleApiResponse(response, `variation: ${context}`);
    });

    return Promise.all(generationPromises);
};

/**
 * Generates a new scene by placing a person from a source image into a background image.
 * @param personImage The image of the person.
 * @param backgroundImage The image to use as the new background.
 * @returns A promise that resolves to an array containing the single data URL of the generated image.
 */
export const generateSceneFromImage = async (
    personImage: File,
    backgroundImage: File,
): Promise<string[]> => {
    console.log(`Generating new scene from background image.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const personImagePart = await fileToPart(personImage);
    const backgroundImagePart = await fileToPart(backgroundImage);
    
    const prompt = `You are an expert photo composition AI.
INSTRUCTIONS:
1.  The first image contains the subject (a person). Perfectly and cleanly isolate the main person from their original background.
2.  The second image is the new background.
3.  Place the isolated person realistically into the new background.
4.  CRITICAL: Analyze the lighting, shadows, and color temperature of the new background image. You MUST adjust the lighting on the person to perfectly match the new environment, making it look as if they were originally photographed there.
5.  Do not change the person's clothing or pose.
OUTPUT: Return ONLY the final, photorealistic composite image.`;

    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [personImagePart, backgroundImagePart, textPart] },
    });
    
    const resultUrl = await handleApiResponse(response, `variation from image`);
    return [resultUrl]; // Return as an array to match the expected type
};

/**
 * Transforms a person into an anime character matching a panel's style.
 * @param personImage The selfie of the person.
 * @param animePanelImage The anime panel providing the art style.
 * @param posePrompt A text description of the desired pose.
 * @returns A promise that resolves to the data URL of the generated image.
 */
export const generateAnimeTransformation = async (
    personImage: File,
    animePanelImage: File,
    posePrompt: string
): Promise<string> => {
    console.log(`Generating anime transformation with pose: "${posePrompt}"`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const personImagePart = await fileToPart(personImage);
    const animePanelPart = await fileToPart(animePanelImage);

    const prompt = `YOU ARE AN EXPERT ANIME ARTIST AI.
Your task is to transform a person from a selfie into an anime character and place them seamlessly into an anime panel scene.

INSTRUCTIONS:
1.  **Analyze Selfie (Image 1):** Identify the key facial features, hair style, and overall appearance of the person in the first image.
2.  **Analyze Style Panel (Image 2):** Critically analyze the art style of the second image (the anime panel). Pay close attention to:
    - Linework (thickness, style)
    - Color palette and shading technique (cel-shading, soft gradients, etc.)
    - Eye style and proportions.
    - Overall texture and feel.
3.  **Create Character:** Transform the person from the selfie into a new anime character. CRITICAL: The character's art style MUST EXACTLY MATCH the style of the anime panel. They should look like they were drawn by the same artist.
4.  **Apply Pose:** Pose the newly created character according to this description: "${posePrompt}".
5.  **Integrate Scene:** Seamlessly integrate the posed character into the anime panel image. The character should look like they are naturally part of the scene, with correct lighting and composition.

OUTPUT: Return ONLY the final, single, high-quality composite image. Do not return text.`;

    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [personImagePart, animePanelPart, textPart] },
    });
    
    return handleApiResponse(response, `anime transformation`);
};


/**
 * Generates Instagram-style captions for a series of images.
 * @param clothingPrompt The user's original prompt for clothing, if any.
 * @param contexts An array of contexts used for image variations.
 * @returns A promise that resolves to an array of caption strings.
 */
export const generateCaptions = async (
    clothingPrompt: string,
    contexts: string[]
): Promise<string[]> => {
    console.log(`Generating captions for contexts:`, contexts);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const clothingDescription = clothingPrompt 
        ? `The person is wearing: "${clothingPrompt}"`
        : "The person is wearing a new outfit.";
    
    const prompt = `You are a witty social media expert. Generate 4-5 catchy Instagram captions for a photo series. ${clothingDescription}. The photos show them in these settings: ${contexts.join(', ')}. The captions should be fun, engaging, and include relevant, popular hashtags and emojis.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    captions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING,
                            description: "An engaging Instagram caption with hashtags and emojis."
                        }
                    }
                }
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        if (result.captions && Array.isArray(result.captions)) {
            return result.captions;
        }
        throw new Error("Invalid JSON structure in caption response.");
    } catch (err) {
        console.error("Failed to parse captions JSON:", err);
        console.error("Raw text response:", response.text);
        // Fallback: return a generic error message as a caption list
        return [
            "Had a great time exploring these places!",
            "New outfit, new adventures! ✨",
            "Which look is your favorite? Let me know! 👇",
            "Making memories all over the world. #travel #style"
        ];
    }
};

/**
 * Refines an image by adjusting pose or expression based on a text prompt.
 * @param sourceImage The image to refine.
 * @param refinementPrompt The user's text instruction for the change.
 * @returns A promise that resolves to the data URL of the refined image.
 */
export const refineImage = async (
    sourceImage: File,
    refinementPrompt: string,
): Promise<string> => {
    console.log(`Refining image with prompt: "${refinementPrompt}"`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const sourceImagePart = await fileToPart(sourceImage);

    const prompt = `You are an expert photo editor. The user wants to refine the person in this image.
User's instruction: "${refinementPrompt}"

Your task is to subtly adjust the person in the image to match the user's instruction. The change should be natural and realistic.
IMPORTANT: Keep everything else in the image (clothing, background, lighting) exactly the same. Only modify the person as requested.`;
    
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [sourceImagePart, textPart] },
    });

    return handleApiResponse(response, `refinement: ${refinementPrompt}`);
};