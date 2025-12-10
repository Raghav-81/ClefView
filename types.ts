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
  transcription: string; // ABC Notation
  description: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ARCHITECTURE = 'ARCHITECTURE',
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}