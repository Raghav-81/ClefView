import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, ArrowRight, Loader2, Download, Edit3, MoveUp, MoveDown, Layers } from 'lucide-react';
import { analyzeAudio } from '../services/geminiService';
import { AudioAnalysisResult } from '../types';

const Dashboard: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Editor & Display State
  const [selectedPart, setSelectedPart] = useState<string>("Full Score");
  const [abcCode, setAbcCode] = useState<string>("");
  const [transposeLevel, setTransposeLevel] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notationRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setResult(null);
    setError(null);
    setAbcCode("");
    setSelectedPart("Full Score");
    setTransposeLevel(0);
    setIsProcessing(true);

    try {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const analysis = await analyzeAudio(base64Data, file.type);
          setResult(analysis);
          
          // Default to Full Score if available, otherwise first key
          const defaultKey = analysis.partTranscriptions["Full Score"] 
            ? "Full Score" 
            : Object.keys(analysis.partTranscriptions)[0];
            
          setSelectedPart(defaultKey);
          setAbcCode(analysis.partTranscriptions[defaultKey] || "");
        } catch (err: any) {
            console.error(err);
          setError("Failed to analyze audio. Please try again.");
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

  // Handle instrument tab switching
  const handlePartChange = (partName: string) => {
    if (!result) return;
    setSelectedPart(partName);
    setAbcCode(result.partTranscriptions[partName] || "");
    setTransposeLevel(0); // Reset transpose on part switch
  };

  const handleDownloadPDF = async () => {
    if (!notationRef.current || !window.html2canvas || !window.jspdf) return;
    
    try {
      // Temporarily expand height for capture if needed, or capture as is
      const canvas = await window.html2canvas(notationRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      pdf.setFontSize(16);
      pdf.text(`${selectedPart} - Transposition: ${transposeLevel}`, 10, 8);

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`ClefView_${selectedPart.replace(/\s/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF.");
    }
  };

  // Render ABC when code or transpose level changes
  useEffect(() => {
    if (abcCode && window.ABCJS && notationRef.current) {
        try {
            window.ABCJS.renderAbc(notationRef.current, abcCode, {
                responsive: 'resize',
                add_classes: true,
                paddingtop: 20,
                paddingbottom: 20,
                paddingleft: 20,
                paddingright: 20,
                visualTranspose: transposeLevel
            });
        } catch (e) {
            console.error("Error rendering ABC notation:", e);
        }
    }
  }, [abcCode, transposeLevel]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 pb-2">
          ClefView
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Transform audio into professional multi-part sheet music. Edit, transpose, and separate instruments instantly.
        </p>
      </div>

      {/* Upload Section */}
      {!result && (
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
                {isProcessing ? "Separating Sources & Transcribing..." : "Start Transcription"}
              </h3>
              <p className="text-slate-500 mt-2">Upload MP3 or WAV</p>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Select Audio File"}
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      {result && (
        <div className="space-y-6">
          {/* Top Bar: Controls & Playback */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/60 p-4 rounded-xl border border-slate-700">
             {audioUrl && <audio controls src={audioUrl} className="h-10 w-full md:w-1/3" />}
             
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button 
                        onClick={() => setTransposeLevel(p => p - 1)}
                        className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition"
                        title="Transpose Down"
                    >
                        <MoveDown className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-mono w-8 text-center text-cyan-400">
                        {transposeLevel > 0 ? `+${transposeLevel}` : transposeLevel}
                    </span>
                    <button 
                        onClick={() => setTransposeLevel(p => p + 1)}
                        className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition"
                        title="Transpose Up"
                    >
                        <MoveUp className="w-4 h-4" />
                    </button>
                </div>

                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                
                 <button 
                  onClick={() => { setResult(null); setAudioUrl(null); }}
                  className="text-sm text-slate-500 hover:text-white underline"
                >
                  New File
                </button>
             </div>
          </div>

          {/* Instrument Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {Object.keys(result.partTranscriptions).map((part) => (
                <button
                    key={part}
                    onClick={() => handlePartChange(part)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                        selectedPart === part
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    <Layers className="w-3 h-3" />
                    {part}
                </button>
            ))}
          </div>

          {/* Split View: Notation & Editor */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Sheet Music View (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-xl overflow-x-auto min-h-[500px] flex flex-col">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-bold border-b pb-2 flex justify-between">
                        <span>Preview: {selectedPart}</span>
                        {transposeLevel !== 0 && <span className="text-red-500">Transposed {transposeLevel} semitones</span>}
                    </div>
                    <div ref={notationRef} className="w-full text-black flex-grow"></div>
                </div>
            </div>

            {/* Live Editor (1/3 width) */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex-grow flex flex-col h-[500px]">
                    <div className="flex items-center gap-2 text-cyan-400 mb-3">
                        <Edit3 className="w-4 h-4" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Live ABC Editor</h3>
                    </div>
                    <textarea 
                        value={abcCode}
                        onChange={(e) => setAbcCode(e.target.value)}
                        className="flex-grow w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 font-mono text-xs md:text-sm text-emerald-300 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                        spellCheck={false}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Edit the code above to instantly fix notes or rhythms.
                    </p>
                </div>

                {/* Quick Info Card */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Music className="w-4 h-4 text-purple-400" /> Track Info
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-slate-700/50 pb-1">
                            <span className="text-slate-400">Tempo</span>
                            <span className="text-cyan-400 font-mono">{result.tempo}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700/50 pb-1">
                            <span className="text-slate-400">Key</span>
                            <span className="text-cyan-400 font-mono">{result.keySignature}</span>
                        </div>
                        <div className="pt-1">
                            <span className="text-slate-400 block mb-1">Instruments:</span>
                            <div className="flex flex-wrap gap-1">
                                {result.instruments.map(i => (
                                    <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{i}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 p-4 bg-red-900/90 border border-red-500 text-white rounded-lg shadow-xl animate-slideUp">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;