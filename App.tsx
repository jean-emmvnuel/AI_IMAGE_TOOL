
import React, { useState, useCallback, ChangeEvent } from 'react';
import { enhanceImage } from './services/geminiService';

interface ImageData {
    base64: string;
    mimeType: string;
    fileName: string;
}

const fileToDataUrl = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type, fileName: file.name });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-12 h-12 text-gray-500"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 mr-2"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const WandIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 mr-2"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-3.197-2.134 3 3 0 0 0-3.196 2.134 3 3 0 0 0 3.196 3.878 3 3 0 0 0 3.197-3.878ZM9.53 16.122l3.196-5.414m-3.196 5.414 3.196 5.414m0 0L21.803 3.673m-6.474 18.455-3.196-5.414m3.196 5.414 3.196-5.414M15.327 3.673l-3.196 5.414m3.196-5.414-3.196-5.414m0 0l-3.196 5.414m0 0l-3.196 5.414m6.474-18.455 3.196 5.414" />
    </svg>
);


interface ImageUploaderProps {
    onImageUpload: (data: ImageData) => void;
    setIsLoading: (isLoading: boolean) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, setIsLoading }) => {
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            try {
                const imageData = await fileToDataUrl(file);
                onImageUpload(imageData);
            } catch (error) {
                console.error("Error processing file:", error);
                alert("Failed to process the image. Please try another file.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <label htmlFor="file-upload" className="relative block w-full p-8 text-center border-2 border-dashed rounded-lg cursor-pointer border-gray-600 hover:border-indigo-500 transition-colors duration-300 bg-gray-800/50">
                <UploadIcon />
                <span className="mt-2 block text-sm font-semibold text-gray-200">
                    Upload a photo to enhance
                </span>
                <span className="mt-1 block text-xs text-gray-400">
                    PNG, JPG, WEBP up to 10MB
                </span>
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                />
            </label>
        </div>
    );
};


const DEFAULT_PROMPT = "Enhance this portrait to look like a professional studio photo. Replace the background with a clean, neutral studio backdrop (light gray). Improve lighting to be soft and flattering, creating depth. Perform color correction for natural skin tones and increase overall sharpness and clarity.";

export default function App() {
    const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (data: ImageData) => {
        setOriginalImage(data);
        setEditedImage(null);
        setError(null);
    };

    const handleEnhance = useCallback(async () => {
        if (!originalImage) return;

        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const resultBase64 = await enhanceImage(originalImage, prompt);
            setEditedImage(resultBase64);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt]);

    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${editedImage}`;
        const originalFileName = originalImage?.fileName.split('.').slice(0, -1).join('.') || 'enhanced-image';
        link.download = `${originalFileName}-enhanced.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleNewPhoto = () => {
        setOriginalImage(null);
        setEditedImage(null);
        setError(null);
        setPrompt(DEFAULT_PROMPT);
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        AI Photo Studio Enhancer
                    </h1>
                    <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
                        Turn your portraits into professional-quality studio shots with a single click.
                    </p>
                </header>

                <main>
                    {!originalImage ? (
                         <ImageUploader onImageUpload={handleImageUpload} setIsLoading={setIsLoading} />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Controls Panel */}
                            <div className="lg:col-span-4 bg-gray-800/50 p-6 rounded-xl shadow-lg flex flex-col">
                                <h2 className="text-xl font-semibold mb-4">Enhancement Controls</h2>
                                
                                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                                    AI Instructions (Prompt)
                                </label>
                                <textarea
                                    id="prompt"
                                    rows={8}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500 mt-2">Describe the changes you want. Be specific for best results.</p>
                                
                                <div className="mt-auto pt-6 space-y-3">
                                    <button
                                        onClick={handleEnhance}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    >
                                        <WandIcon />
                                        {isLoading ? 'Enhancing...' : 'Enhance Photo'}
                                    </button>
                                     <button
                                        onClick={handleNewPhoto}
                                        className="w-full flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        Upload New Photo
                                    </button>
                                </div>
                            </div>

                            {/* Image Viewer Panel */}
                            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Original Image */}
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-semibold mb-3 text-center text-gray-400">Original</h3>
                                    <div className="aspect-w-3 aspect-h-4 bg-gray-800/50 rounded-xl overflow-hidden shadow-md">
                                        <img src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} alt="Original" className="w-full h-full object-contain"/>
                                    </div>
                                </div>
                                {/* Edited Image */}
                                <div className="flex flex-col">
                                     <h3 className="text-lg font-semibold mb-3 text-center text-gray-400">Enhanced</h3>
                                    <div className="relative aspect-w-3 aspect-h-4 bg-gray-800/50 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
                                        {isLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 z-10">
                                                <div className="w-12 h-12 border-4 border-t-indigo-400 border-gray-600 rounded-full animate-spin"></div>
                                                <p className="mt-4 text-sm font-medium">AI is working its magic...</p>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="p-4 text-center text-red-400">
                                                <p className="font-semibold">Enhancement Failed</p>
                                                <p className="text-xs mt-1">{error}</p>
                                            </div>
                                        )}
                                        {editedImage && !isLoading && (
                                            <>
                                                <img src={`data:image/png;base64,${editedImage}`} alt="Enhanced" className="w-full h-full object-contain"/>
                                                <button
                                                    onClick={handleDownload}
                                                    className="absolute bottom-4 right-4 flex items-center px-4 py-2 bg-black/50 text-white font-semibold rounded-lg hover:bg-black/80 backdrop-blur-sm transition-all duration-200"
                                                >
                                                   <DownloadIcon/> Download
                                                </button>
                                            </>
                                        )}
                                        {!editedImage && !isLoading && !error && (
                                            <div className="text-center text-gray-500 p-4">
                                                <p>Your enhanced photo will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
