import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- UTILITY FUNCTIONS --- //

/**
 * Converts a HEX color string to an RGB object.
 * Supports 3-digit and 6-digit hex codes.
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return null;
};

/**
 * Converts RGB color values to a HEX string.
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Determines whether to use black or white text on a given hex background color.
 */
const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  // Formula for luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Generates shades (darker) and tints (lighter) of a given hex color.
 */
const generatePalette = (hex: string): { shades: string[]; tints: string[] } => {
  const baseRgb = hexToRgb(hex);
  if (!baseRgb) return { shades: [], tints: [] };

  const shades = [];
  const tints = [];
  const steps = 5;

  // Generate Shades (mix with black)
  for (let i = 1; i <= steps; i++) {
    const amount = i * 0.15;
    const r = Math.round(baseRgb.r * (1 - amount));
    const g = Math.round(baseRgb.g * (1 - amount));
    const b = Math.round(baseRgb.b * (1 - amount));
    shades.push(rgbToHex(r, g, b));
  }

  // Generate Tints (mix with white)
  for (let i = 1; i <= steps; i++) {
    const amount = i * 0.15;
    const r = Math.round(baseRgb.r * (1 - amount) + 255 * amount);
    const g = Math.round(baseRgb.g * (1 - amount) + 255 * amount);
    const b = Math.round(baseRgb.b * (1 - amount) + 255 * amount);
    tints.push(rgbToHex(r, g, b));
  }

  return { shades: shades.reverse(), tints };
};

// --- REACT COMPONENTS --- //

// FIX: Added explicit types for component props to ensure type safety.
type ColorInputProps = {
  label: string;
  color: string;
  setColor: (color: string) => void;
};

const ColorInput = ({ label, color, setColor }: ColorInputProps) => {
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hexValue = e.target.value.replace(/[^a-fA-F0-9]/g, '').slice(0, 6);
    setColor('#' + hexValue);
  };
  
  // Ensure color is a valid hex for the color picker, otherwise fallback
  const isValidHex = /^#[0-9A-F]{6}$/i.test(color);
  const displayValue = color.startsWith('#') ? color.substring(1) : color;
  
  return (
    <div className="color-group">
      <label>{label}</label>
      <div className="color-input-wrapper">
        <input 
          type="color" 
          className="color-picker" 
          value={isValidHex ? color : '#000000'}
          onChange={(e) => setColor(e.target.value)}
          aria-label={`Select ${label} color`}
        />
        <div className="hex-input-container">
          <span className="hex-prefix">#</span>
          <input 
            type="text" 
            className="hex-input"
            value={displayValue.toUpperCase()}
            onChange={handleHexChange}
            aria-label={`${label} color hex code`}
          />
        </div>
      </div>
    </div>
  );
};

// FIX: Added explicit types for component props to fix errors related to the 'key' prop in lists.
type ColorSwatchProps = {
  hex: string;
  isBase?: boolean;
  onCopy: (hex: string) => void;
};

const ColorSwatch = ({ hex, isBase = false, onCopy }: ColorSwatchProps) => {
  const textColor = useMemo(() => getContrastColor(hex), [hex]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    onCopy(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`color-swatch ${isBase ? 'base-color' : ''}`}
      style={{ backgroundColor: hex, color: textColor }}
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      aria-label={`Copy color ${hex}`}
      onKeyDown={(e) => e.key === 'Enter' && handleCopy()}
    >
      {copied && <div className="copy-feedback">Copied!</div>}
      <span>{hex.toUpperCase()}</span>
    </div>
  );
};


type UIMockupProps = {
  primary: string;
  secondary: string;
  accent: string;
  theme: 'light' | 'dark';
};

const UIMockup: React.FC<UIMockupProps> = ({ primary, secondary, accent, theme }) => {
  const styles = useMemo(() => {
    const primaryContrast = getContrastColor(primary);
    const accentContrast = getContrastColor(accent);
    const secondaryContrast = getContrastColor(secondary);

    if (theme === 'dark') {
      return {
        container: { backgroundColor: primary, color: primaryContrast },
        headerText: { color: primaryContrast },
        subHeaderText: { color: primaryContrast, opacity: 0.8 },
        card: { backgroundColor: secondary, color: secondaryContrast },
        cardSubText: { color: secondaryContrast, opacity: 0.7 },
        historyTitle: { color: primaryContrast },
        historyText: { color: primaryContrast, opacity: 0.9 },
        historyProgress: { backgroundColor: secondary, opacity: 0.5 },
        historyCircle: { backgroundColor: secondary, opacity: 0.7 },
        button: { backgroundColor: accent, color: accentContrast },
      };
    } else { // light theme
      const lightBg = generatePalette(primary).tints[3] || '#f8f9fa';
      const darkText = generatePalette(primary).shades[3] || '#2c3e50';
      return {
        container: { backgroundColor: lightBg, color: darkText, border: `1px solid ${generatePalette(primary).tints[2]}` },
        headerText: { color: darkText },
        subHeaderText: { color: primary },
        card: { backgroundColor: primary, color: primaryContrast },
        cardSubText: { color: primaryContrast, opacity: 0.8 },
        historyTitle: { color: darkText },
        historyText: { color: primary, opacity: 0.9 },
        historyProgress: { backgroundColor: secondary, opacity: 0.3 },
        historyCircle: { backgroundColor: secondary },
        button: { backgroundColor: accent, color: accentContrast },
      };
    }
  }, [primary, secondary, accent, theme]);

  return (
    <div className={`ui-mockup theme-${theme}`} style={styles.container}>
      <header className="mockup-header">
        <div>
          <p className="mockup-greeting" style={styles.subHeaderText}>Hi Neelakshi</p>
          <h3 className="mockup-title" style={styles.headerText}>What do you want to learn?</h3>
        </div>
        <div className="mockup-avatar" style={theme === 'dark' ? {backgroundColor: secondary, opacity: 0.7} : {backgroundColor: primary, opacity: 0.3}}></div>
      </header>

      <div className="mockup-card" style={styles.card}>
        <h4>UI design</h4>
        <p style={styles.cardSubText}>52 Students</p>
      </div>

      <div className="mockup-history">
        <h4 style={styles.historyTitle}>Your History</h4>
        <div className="mockup-history-item">
          <div className="mockup-history-text">
            <p style={styles.historyText}>Development</p>
            <div className="mockup-progress-bar" style={{...styles.historyProgress, opacity: 0.2}}>
              <div className="mockup-progress-fill" style={{...styles.historyProgress, width: '70%', opacity: 1}}></div>
            </div>
          </div>
          <div className="mockup-history-icon" style={styles.historyCircle}></div>
        </div>
        <div className="mockup-history-item">
          <div className="mockup-history-text">
            <p style={styles.historyText}>Color Theory</p>
             <div className="mockup-progress-bar" style={{...styles.historyProgress, opacity: 0.2}}>
              <div className="mockup-progress-fill" style={{...styles.historyProgress, width: '40%', opacity: 1}}></div>
            </div>
          </div>
          <div className="mockup-history-icon" style={styles.historyCircle}></div>
        </div>
        <div className="mockup-history-item">
          <div className="mockup-history-text">
            <p style={styles.historyText}>Illustration Basics</p>
             <div className="mockup-progress-bar" style={{...styles.historyProgress, opacity: 0.2}}>
              <div className="mockup-progress-fill" style={{...styles.historyProgress, width: '90%', opacity: 1}}></div>
            </div>
          </div>
          <div className="mockup-history-icon" style={styles.historyCircle}></div>
        </div>
      </div>

      <button className="mockup-button" style={styles.button}>Show Details</button>
    </div>
  );
};


const App: React.FC = () => {
    const getInitialColors = () => {
    try {
      const savedPalette = localStorage.getItem('colorPalette');
      if (savedPalette) {
        return JSON.parse(savedPalette);
      }
    } catch (error) {
      console.error("Error parsing palette from localStorage", error);
    }
    // Return default colors if nothing is saved or parsing fails
    return {
      primary: '#8a5a2a',
      secondary: '#e0e0e0',
      accent: '#6b2a1d'
    };
  };

  const [primary, setPrimary] = useState(getInitialColors().primary);
  const [secondary, setSecondary] = useState(getInitialColors().secondary);
  const [accent, setAccent] = useState(getInitialColors().accent);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  
  const primaryPalette = useMemo(() => generatePalette(primary), [primary]);
  const secondaryPalette = useMemo(() => generatePalette(secondary), [secondary]);
  
  const randomizePalette = useCallback(() => {
    const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setPrimary(randomColor());
    setSecondary(randomColor());
    setAccent(randomColor());
  }, []);
  
  useEffect(() => {
    try {
      const palette = { primary, secondary, accent };
      localStorage.setItem('colorPalette', JSON.stringify(palette));
    } catch (error) {
      console.error("Failed to save palette to localStorage", error);
    }
  }, [primary, secondary, accent]);


  return (
    <div className="app-container">
      <aside className="controls">
        <div className="controls-header">
          <h1>Palette Engine</h1>
          <button className="randomize-btn" onClick={randomizePalette} aria-label="Randomize Palette" title="Randomize Palette">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644L6.166 16.46m12.12-3.183a8.25 8.25 0 01-11.664 0M17.834 6.166L14.653 9.348" />
            </svg>
          </button>
        </div>
        <p className="controls-subheader"></p>
        
        <ColorInput label="Primary (60%)" color={primary} setColor={setPrimary} />
        <ColorInput label="Secondary (30%)" color={secondary} setColor={setSecondary} />
        <ColorInput label="Accent (10%)" color={accent} setColor={setAccent} />

      </aside>
      
      <main className="preview">
        <div className="palette-row">
          <h2>Primary</h2>
          <div className="color-ramp">
            {primaryPalette.shades.map(hex => <ColorSwatch key={hex} hex={hex} onCopy={setCopiedColor} />)}
            <ColorSwatch hex={primary} isBase onCopy={setCopiedColor} />
            {primaryPalette.tints.map(hex => <ColorSwatch key={hex} hex={hex} onCopy={setCopiedColor} />)}
          </div>
        </div>
        <div className="palette-row">
          <h2>Secondary</h2>
          <div className="color-ramp">
            {secondaryPalette.shades.map(hex => <ColorSwatch key={hex} hex={hex} onCopy={setCopiedColor} />)}
            <ColorSwatch hex={secondary} isBase onCopy={setCopiedColor} />
            {secondaryPalette.tints.map(hex => <ColorSwatch key={hex} hex={hex} onCopy={setCopiedColor} />)}
          </div>
        </div>
        <div className="palette-row">
          <h2>Accent</h2>
          <div className="color-ramp">
            <ColorSwatch hex={accent} isBase onCopy={setCopiedColor} />
          </div>
        </div>

        <div className="preview-divider">
            <h2>UI Preview</h2>
        </div>

        <div className="mockup-previews">
          <UIMockup theme="dark" primary={primary} secondary={secondary} accent={accent} />
          <UIMockup theme="light" primary={primary} secondary={secondary} accent={accent} />
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);