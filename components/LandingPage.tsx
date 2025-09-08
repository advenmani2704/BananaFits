/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BananaIcon, DressIcon, GlobeIcon, ChatBubbleIcon, UploadIcon, MagicWandIcon } from './icons';

interface LandingPageProps {
  onFileSelect: (file: File) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  return (
    <div className="font-sans bg-off-white text-gray-800">
      {/* Hero Section */}
      <header className="relative text-center py-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-banana-yellow/30 transform -skew-y-3 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BananaIcon className="w-10 h-10 text-brand-orange" />
            <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900">BananaFits</h1>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-6">Drip without the trip.</p>
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-4">
            AI-Powered Virtual Try-On, <span className="text-brand-orange">Instantly.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-700 mb-8">
            Upload your photo, try on multiple garments from images or text, see a 360° view of your outfit, refine your pose, change your background, generate Instagram captions, and yes—even anime-fy yourself!
          </p>
          <label 
            htmlFor="landing-upload-hero"
            className="bg-brand-orange text-white font-bold text-xl px-10 py-5 rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 cursor-pointer inline-block"
          >
            Upload Your Photo
          </label>
          <input id="landing-upload-hero" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
      </header>

      <main>
        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-12">From Selfie to Story in Seconds</h2>
            <div className="flex flex-col items-center gap-8">
                <img 
                  src="https://github.com/advenmani2704/snowflake_test_data/blob/main/Screenshot%202025-09-07%20at%2012.17.15%20AM.png?raw=true" 
                  alt="BananaFits workflow showing a person getting styled, changing backgrounds, and transforming into an anime character" 
                  className="w-full max-w-6xl mx-auto rounded-lg shadow-2xl border-4 border-black" 
                />
                <img 
                  src="https://github.com/advenmani2704/snowflake_test_data/blob/main/Screenshot%202025-09-08%20at%2010.10.12%20AM.png?raw=true" 
                  alt="BananaFits workflow showing 360 degree views and pose refinement" 
                  className="w-full max-w-6xl mx-auto rounded-lg shadow-2xl border-4 border-black" 
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-12 text-center">Explore the Possibilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="p-8 bg-gray-50 rounded-xl shadow-md transform hover:-translate-y-2 transition-transform duration-300">
                <DressIcon className="w-12 h-12 mx-auto text-brand-orange mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Full Outfit Control</h3>
                <p className="text-gray-700">Try on any clothing, see it from every angle with a 360° view, and even refine your pose.</p>
              </div>
              <div className="p-8 bg-gray-50 rounded-xl shadow-md transform hover:-translate-y-2 transition-transform duration-300">
                <GlobeIcon className="w-12 h-12 mx-auto text-brand-orange mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Generate New Scenes</h3>
                <p className="text-gray-700">Place yourself in any setting, from an airport cafe to a serene beach, with a single prompt.</p>
              </div>
              <div className="p-8 bg-gray-50 rounded-xl shadow-md transform hover:-translate-y-2 transition-transform duration-300">
                <MagicWandIcon className="w-12 h-12 mx-auto text-brand-orange mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Become an Anime Character</h3>
                <p className="text-gray-700">Transform your photo into a unique anime-style character, matching any reference panel.</p>
              </div>
              <div className="p-8 bg-gray-50 rounded-xl shadow-md transform hover:-translate-y-2 transition-transform duration-300">
                <ChatBubbleIcon className="w-12 h-12 mx-auto text-brand-orange mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Social-Ready Captions</h3>
                <p className="text-gray-700">Generate witty, shareable captions for your creations, complete with hashtags and emojis.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section className="py-24 bg-white text-center">
            <div className="max-w-3xl mx-auto px-4">
                 <h2 className="text-5xl font-extrabold text-gray-900 mb-4">No changing rooms. No limits.</h2>
                 <p className="text-xl text-gray-700 mb-8">
                    BananaFits lets you experiment with style, creativity, and fantasy—instantly.
                 </p>
                 <label 
                    htmlFor="landing-upload-cta"
                    className="bg-brand-orange text-white font-bold text-xl px-10 py-5 rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 cursor-pointer inline-block"
                 >
                    Try BananaFits Now
                 </label>
                 <input id="landing-upload-cta" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
            <div className="flex items-center justify-center gap-2 mb-2">
                 <BananaIcon className="w-5 h-5" />
                 <p className="font-semibold">Built with NanoBanana AI · Styled by you.</p>
            </div>
            <div className="flex justify-center gap-6 text-sm">
                <a href="#" className="hover:text-brand-orange">About</a>
                <a href="#" className="hover:text-brand-orange">GitHub</a>
                <a href="#" className="hover:text-brand-orange">Kaggle Submission</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;