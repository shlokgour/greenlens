import React, { useState, useRef } from 'react';
import { Camera, Upload, ScanLine, X } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (text: string, image?: File) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !selectedImage) return;
    onAnalyze(text, selectedImage || undefined);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-green-600 p-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Check Your Product</h2>
        <p className="text-green-100 text-sm">Upload a label, barcode, or ingredients to uncover the truth.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Image Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">Product Image (Label, Ingredients, Claims)</label>
          
          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-green-400 transition-all group"
            >
              <div className="bg-green-50 p-4 rounded-full mb-3 group-hover:bg-green-100 transition-colors">
                <Camera className="text-green-600" size={32} />
              </div>
              <p className="text-slate-600 font-medium">Tap to Scan or Upload</p>
              <p className="text-slate-400 text-xs mt-1">Supports JPG, PNG</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
              <button 
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
          />
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">Or Paste Text (Barcode, Name, Ingredients)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. 890123456789 (Barcode), Product Name, Aqua, Sodium Laureth Sulfate, 'All Natural' claim... (Mention any allergies)"
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none h-32 text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || (!text && !selectedImage)}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200
            ${isLoading || (!text && !selectedImage) 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl hover:-translate-y-0.5'}`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <ScanLine size={20} />
              <span>Analyze Now</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputSection;