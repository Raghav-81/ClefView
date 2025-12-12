import React from 'react';

declare global {
  interface Window {
    ABCJS: any;
    jspdf: any;
    html2canvas: any;
  }
}

export interface AudioAnalysisResult {
  instruments: string[];
  tempo: string;
  keySignature: string;
  // Map of instrument name (key) to ABC notation (value). 
  // Should always contain a 'Full Score' key.
  partTranscriptions: Record<string, string>; 
  description: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}