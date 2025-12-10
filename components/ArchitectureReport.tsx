import React from 'react';
import { Server, Cpu, Activity, AlertTriangle, FileCode } from 'lucide-react';

const ArchitectureReport: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 animate-fadeIn">
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Technical Design Specification</h1>
        <p className="text-slate-400">Audio-to-Score Transcription Pipeline v1.0</p>
      </div>

      {/* Section 1: Stack */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Server className="w-6 h-6" />
          <h2 className="text-xl font-semibold">1. Core Technology Stack & Libraries</h2>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li><strong className="text-white">Programming Language:</strong> Python 3.9+ (Standard for ML/Audio research).</li>
            <li><strong className="text-white">AI/ML Framework:</strong> PyTorch (Preferred for deep learning audio models).</li>
            <li><strong className="text-white">Audio Processing:</strong> <code>librosa</code> (Feature extraction), <code>torchaudio</code> (Tensor loading/transforms), <code>ffmpeg</code> (Format conversion).</li>
            <li><strong className="text-white">Symbolic Music:</strong> <code>music21</code> or <code>mido</code> (MIDI/MusicXML manipulation).</li>
          </ul>
        </div>
      </section>

      {/* Section 2: Models */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-purple-400">
          <Cpu className="w-6 h-6" />
          <h2 className="text-xl font-semibold">2. ML Model Selection & Justification</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-3">(A) Source Separation: HT Demucs (Hybrid Transformer)</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              <strong>Justification:</strong> HT Demucs currently holds state-of-the-art performance on the MUSDB18 benchmark. It effectively separates drums, bass, vocals, and "other" (melody) stems with high SDR (Signal-to-Distortion Ratio). Isolating the melody line is crucial before transcription to reduce polyphonic interference.
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-3">(B) Transcription: MT3 (Music Transcription with Transformers)</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              <strong>Justification:</strong> Developed by Google Magenta, MT3 treats transcription as a sequence-to-sequence task using T5 architecture. Unlike older frame-based models (like Onsets and Frames), MT3 supports multi-instrument transcription directly and handles note duration/velocity with high F1-scores on polyphonic datasets like Slakh2100.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Data Flow */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Activity className="w-6 h-6" />
          <h2 className="text-xl font-semibold">3. Data Flow Pipeline (Architecture)</h2>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <ol className="list-decimal list-inside space-y-4 text-slate-300">
            <li className="pl-2">
              <span className="text-white font-medium">Ingestion:</span> User uploads audio (.mp3/.wav). File is resampled to 16kHz mono (for MT3) or 44.1kHz stereo (for Demucs).
            </li>
            <li className="pl-2">
              <span className="text-white font-medium">Source Separation:</span> Input Audio $\rightarrow$ <strong>HT Demucs</strong> $\rightarrow$ 4 Stems (Vocals, Drums, Bass, Other).
            </li>
            <li className="pl-2">
              <span className="text-white font-medium">Stem Selection:</span> The 'Other' (piano/guitar) and 'Vocals' stems are mixed down to a target track for melody transcription.
            </li>
            <li className="pl-2">
              <span className="text-white font-medium">Inference:</span> Target Track $\rightarrow$ Log Mel Spectrogram $\rightarrow$ <strong>MT3 Transformer</strong> $\rightarrow$ Token Sequence.
            </li>
            <li className="pl-2">
              <span className="text-white font-medium">Decoding:</span> Token Sequence $\rightarrow$ MIDI Events (Note On, Note Off, Velocity).
            </li>
            <li className="pl-2">
              <span className="text-white font-medium">Rendering:</span> MIDI $\rightarrow$ <strong>MusicXML/ABC</strong> $\rightarrow$ Sheet Music Renderer.
            </li>
          </ol>
        </div>
      </section>

      {/* Section 4: Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">4. Key Technical Challenges & Mitigation</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-amber-500">
            <h3 className="text-white font-medium">Challenge 1: Polyphonic Octave Errors</h3>
            <p className="text-slate-400 text-sm mt-1">
              Models often confuse the fundamental frequency with its first harmonic (octave error).
              <br />
              <strong>Mitigation:</strong> Implement a post-processing heuristic using a Pitch Class Profile (PCP) check or an auxiliary "Pitch Contour" model (like SPICE) to validate octave range against the spectral centroid of the separated stem.
            </p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-amber-500">
            <h3 className="text-white font-medium">Challenge 2: Onset/Offset Timing Precision</h3>
            <p className="text-slate-400 text-sm mt-1">
              Spectrogram-based transformers may result in "jittery" note durations that look messy on sheet music.
              <br />
              <strong>Mitigation:</strong> Apply rhythmic quantization (snapping to nearest 1/16th or 1/32nd note grid) based on the detected BPM before generating the final MusicXML. Use a Hidden Markov Model (HMM) for beat tracking alignment.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Pseudo-Code */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <FileCode className="w-6 h-6" />
          <h2 className="text-xl font-semibold">5. Implementation Logic (Pseudo-code)</h2>
        </div>
        <div className="bg-[#1e1e1e] p-6 rounded-lg border border-slate-700 overflow-x-auto font-mono text-sm">
          <pre className="text-green-400">
{`# High-level pipeline controller

def main_workflow(user_file):
    # 1. Ingestion
    audio_tensor = upload_audio(user_file)
    
    # 2. Separation
    # Returns a dict of stems (vocals, drums, bass, other)
    stems = perform_source_separation(audio_tensor)
    
    # 3. Transcription
    # Focus on melodic stems for score generation
    sheet_music_xml = generate_sheet_music(stems)
    
    return sheet_music_xml


# ---------------------------------------------------------
# Core Stage Functions
# ---------------------------------------------------------

def upload_audio(file_path):
    """Loads audio and resamples to 16kHz for MT3."""
    waveform, sample_rate = librosa.load(file_path, sr=16000)
    return torch.from_numpy(waveform)

def perform_source_separation(audio_tensor):
    """Applies HT Demucs to isolate instruments."""
    model = load_model("ht_demucs_v4")
    # Returns tensor of shape [4, channels, length]
    separated = model.apply(audio_tensor)
    return {
        'vocals': separated[0],
        'drums': separated[1],
        'bass': separated[2],
        'other': separated[3]
    }

def generate_sheet_music(stems):
    """Transforms audio stems into symbolic music notation."""
    # Mix relevant stems (e.g., piano + vocals) for melody
    melody_mix = stems['other'] + stems['vocals']
    
    # Generate MIDI tokens using MT3 Transformer
    transcriber = load_model("mt3_transformer")
    midi_sequence = transcriber.predict(melody_mix)
    
    # Convert to standard notation
    quantized_midi = quantize(midi_sequence, grid="1/16")
    return midi_to_musicxml(quantized_midi)`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ArchitectureReport;