import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Play, Pause, FileAudio, ArrowRight, Loader2, Download } from 'lucide-react';
import { analyzeAudio } from '../services/geminiService';
import { AudioAnalysisResult } from '../types';

const Dashboard: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notationRef = useRef<HTMLDivElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setResult(null);
    setError(null);
    setIsProcessing(true);

    try {
      // Create local URL for playback
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64Data = base64String.split(',')[1];
        
        try {
          const analysis = await analyzeAudio(base64Data, file.type);
          setResult(analysis);
        } catch (err: any) {
            console.error(err);
          setError("Failed to analyze audio. Please ensure the API Key is valid and the file is supported.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!notationRef.current || !window.html2canvas || !window.jspdf) return;
    
    try {
      const canvas = await window.html2canvas(notationRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190; // A4 width minus margins
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('sheet_music.pdf');
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  useEffect(() => {
    if (result && result.transcription && window.ABCJS && notationRef.current) {
        try {
            window.ABCJS.renderAbc(notationRef.current, result.transcription, {
                responsive: 'resize',
                add_classes: true,
                paddingtop: 20,
                paddingbottom: 20,
                paddingleft: 20,
                paddingright: 20,
            });
        } catch (e) {
            console.error("Error rendering ABC notation:", e);
        }
    }
  }, [result]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4 py-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 pb-2">
          AI Audio Transcription
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Upload an audio file to generate an instant analysis, instrument breakdown, and full sheet music using Gemini 2.5 Flash.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:border-cyan-500/50 transition-colors duration-300">
        <input 
          type="file" 
          accept="audio/*" 
          onChange={handleFileUpload} 
          className="hidden" 
          ref={fileInputRef}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center text-cyan-400">
            {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white">
              {isProcessing ? "Analyzing Audio..." : "Drop your audio file here"}
            </h3>
            <p className="text-slate-500 mt-2">Supports MP3, WAV (Max 10MB recommended)</p>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Select File"}
          </button>
        </div>
      </div>

      {/* Audio Player Preview */}
      {audioUrl && (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex items-center justify-center">
            <audio controls src={audioUrl} className="w-full max-w-md h-10" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-center">
          {error}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="grid md:grid-cols-2 gap-6 animate-slideUp">
          {/* Analysis Card */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
              <Music className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Musical Analysis</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Description</span>
                <p className="text-slate-200 mt-1">{result.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <span className="text-slate-500 text-xs uppercase">BPM</span>
                    <p className="text-2xl font-mono text-cyan-400">{result.tempo}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <span className="text-slate-500 text-xs uppercase">Key</span>
                    <p className="text-2xl font-mono text-cyan-400">{result.keySignature}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Detected Instruments</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.instruments.map((inst, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-sm">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Transcription Card */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <FileAudio className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Sheet Music</h2>
              </div>
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-600/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
            
            {/* Sheet Music Rendering */}
            <div className="bg-white rounded-lg p-2 mb-4 overflow-x-auto min-h-[150px] flex items-center justify-center shadow-lg">
                 <div ref={notationRef} className="w-full text-black"></div>
            </div>

            <div className="flex-grow bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs md:text-sm text-emerald-300 overflow-auto whitespace-pre-wrap shadow-inner shadow-black/50 max-h-60">
              {result.transcription}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => navigator.clipboard.writeText(result.transcription)}
                className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                Copy ABC Code <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;