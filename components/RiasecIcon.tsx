import React from 'react';
import { RIASECKey } from '../types';

interface RiasecIconProps {
  type: RIASECKey;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'tinted' | 'solid' | 'bare';
  className?: string;
}

const ICON_PALETTE: Record<
  RIASECKey,
  {
    primary: string;
    secondary: string;
    softBg: string;
    borderColor: string;
    title: string;
  }
> = {
  R: {
    primary: '#059669',
    secondary: '#10b981',
    softBg: '#ecfdf5',
    borderColor: '#a7f3d0',
    title: 'النمط الواقعي - Realistic',
  },
  I: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    softBg: '#eff6ff',
    borderColor: '#bfdbfe',
    title: 'النمط الاستقصائي - Investigative',
  },
  A: {
    primary: '#db2777',
    secondary: '#ec4899',
    softBg: '#fdf2f8',
    borderColor: '#fbcfe8',
    title: 'النمط الفني - Artistic',
  },
  S: {
    primary: '#d97706',
    secondary: '#f59e0b',
    softBg: '#fffbeb',
    borderColor: '#fde68a',
    title: 'النمط الاجتماعي - Social',
  },
  E: {
    primary: '#dc2626',
    secondary: '#ef4444',
    softBg: '#fef2f2',
    borderColor: '#fecaca',
    title: 'النمط المغامر - Enterprising',
  },
  C: {
    primary: '#4f46e5',
    secondary: '#6366f1',
    softBg: '#eef2ff',
    borderColor: '#c7d2fe',
    title: 'النمط التقليدي - Conventional',
  },
};

const SIZE_MAP: Record<
  NonNullable<RiasecIconProps['size']>,
  { boxPx: number; svgPx: number; radiusClass: string }
> = {
  xs: { boxPx: 28, svgPx: 18, radiusClass: 'rounded-lg' },
  sm: { boxPx: 38, svgPx: 24, radiusClass: 'rounded-xl' },
  md: { boxPx: 48, svgPx: 30, radiusClass: 'rounded-2xl' },
  lg: { boxPx: 60, svgPx: 38, radiusClass: 'rounded-2xl' },
};

/**
 * Custom duotone illustrative SVG icons for Holland's 6 RIASEC personality types.
 * Uses explicit SVG presentation attributes so icons render crisply on screen,
 * in browser print, and inside html2canvas PDF exports.
 */
const RiasecIcon: React.FC<RiasecIconProps> = ({
  type,
  size = 'md',
  variant = 'tinted',
  className = '',
}) => {
  const palette = ICON_PALETTE[type];
  const dims = SIZE_MAP[size];
  const isSolid = variant === 'solid';
  const strokeColor = isSolid ? '#ffffff' : palette.primary;
  const accentFill = isSolid ? '#ffffff' : palette.secondary;
  const accentOpacity = isSolid ? 0.24 : 0.2;

  const renderGlyph = () => {
    switch (type) {
      case 'R':
        // الواقعي (Realistic): Precision Gear & Engineering Wrench
        return (
          <svg
            width={dims.svgPx}
            height={dims.svgPx}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={palette.title}
          >
            {/* Duotone gear disc */}
            <circle
              cx="13"
              cy="19"
              r="6.5"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.9"
            />
            <circle cx="13" cy="19" r="2.5" fill={strokeColor} />
            {/* Gear teeth */}
            <path
              d="M13 10.2V12.2M13 25.8V27.8M4.2 19H6.2M19.8 19H21.8M6.8 12.8L8.2 14.2M17.8 23.8L19.2 25.2M19.2 12.8L17.8 14.2M8.2 23.8L6.8 25.2"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Crossed open-end wrench */}
            <path
              d="M17.5 14.5L24.2 7.8C25.5 8.1 26.7 9.1 27 10.6L24.6 13L22.2 12.6L21.8 10.2L24.2 7.8"
              fill={accentFill}
              fillOpacity={accentOpacity}
            />
            <path
              d="M16.2 15.8L22.3 9.7M22.4 6.2C20.5 6.7 19.5 8.6 20.1 10.5L15.6 15L17 16.4L21.5 11.9C23.4 12.5 25.3 11.5 25.8 9.6L23.5 11.9L21.4 11.5L21 9.4L23.3 7.1"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'I':
        // الاستقصائي (Investigative): Scientific Microscope & Discovery Spark
        return (
          <svg
            width={dims.svgPx}
            height={dims.svgPx}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={palette.title}
          >
            {/* Microscope optical tube */}
            <rect
              x="14.5"
              y="5.5"
              width="5"
              height="10.5"
              rx="2"
              transform="rotate(22 14.5 5.5)"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.9"
            />
            {/* Eyepiece cap */}
            <path
              d="M15.2 4.5L20.2 6.5"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Curved C-arm */}
            <path
              d="M17.2 12.5C21.5 13.8 24 17.5 23.2 21.8C22.6 24.8 19.8 26.8 16.5 26.8H9"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Specimen stage */}
            <path
              d="M8.5 20.5H17.5"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Base platform */}
            <rect
              x="6.5"
              y="26.2"
              width="19"
              height="2.6"
              rx="1.3"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.8"
            />
            {/* Discovery atom/star node */}
            <circle
              cx="8.5"
              cy="10.5"
              r="2.6"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.7"
            />
            <circle cx="8.5" cy="10.5" r="1" fill={strokeColor} />
          </svg>
        );

      case 'A':
        // الفني (Artistic): Creative Artist Palette & Brush
        return (
          <svg
            width={dims.svgPx}
            height={dims.svgPx}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={palette.title}
          >
            {/* Artist palette silhouette */}
            <path
              d="M15.5 5.5C9.7 5.5 5 10.1 5 15.8C5 21.4 9.5 26 15.2 26C17.1 26 18.4 24.6 18.4 22.9C18.4 22 18 21.3 17.5 20.7C17 20.1 16.8 19.5 17.2 18.8C17.6 18.1 18.5 17.8 19.5 17.8H21.2C24.4 17.8 26.8 15.4 26.8 12.3C26.8 8.4 21.7 5.5 15.5 5.5Z"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            {/* Color pigment dots */}
            <circle cx="10.2" cy="13.2" r="1.6" fill={strokeColor} />
            <circle cx="14.2" cy="10.2" r="1.6" fill={strokeColor} />
            <circle cx="19.2" cy="11.2" r="1.6" fill={strokeColor} />
            <circle cx="10.5" cy="18.2" r="1.6" fill={strokeColor} />
            {/* Angled fine paintbrush */}
            <path
              d="M21.5 26.5L27.5 20.5"
              stroke={strokeColor}
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <path
              d="M19.2 27.3C20.2 27.5 21.5 27.2 22.1 26.5C22.6 25.9 22.5 24.9 21.9 24.4C21.2 23.8 20.2 24.1 19.8 25C19.5 25.7 19.5 26.6 19.2 27.3Z"
              fill={strokeColor}
            />
          </svg>
        );

      case 'S':
        // الاجتماعي (Social): Connected Community & Supportive Heart
        return (
          <svg
            width={dims.svgPx}
            height={dims.svgPx}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={palette.title}
          >
            {/* Central empathy heart above community */}
            <path
              d="M16 13.8C16 13.8 11.5 10.9 11.5 8.1C11.5 6.6 12.7 5.5 14.1 5.5C15 5.5 15.6 6 16 6.7C16.4 6 17 5.5 17.9 5.5C19.3 5.5 20.5 6.6 20.5 8.1C20.5 10.9 16 13.8 16 13.8Z"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Left person */}
            <circle
              cx="10.5"
              cy="17"
              r="2.8"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.8"
            />
            <path
              d="M5.5 26.2C5.5 23.3 7.7 21.3 10.5 21.3C12.3 21.3 13.8 22.1 14.7 23.4"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            {/* Right person */}
            <circle
              cx="21.5"
              cy="17"
              r="2.8"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.8"
            />
            <path
              d="M26.5 26.2C26.5 23.3 24.3 21.3 21.5 21.3C19.7 21.3 18.2 22.1 17.3 23.4"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            {/* Connecting bridge arc */}
            <path
              d="M12.5 26.2H19.5"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'E':
        // المغامر (Enterprising): Leadership Rocket & Growth Trajectory
        return (
          <svg
            width={dims.svgPx}
            height={dims.svgPx}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={palette.title}
          >
            {/* Rocket body */}
            <path
              d="M24.8 7.2C25.2 12.2 22.8 17.2 18.8 21.2L10.8 13.2C14.8 9.2 19.8 6.8 24.8 7.2Z"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            {/* Rocket window */}
            <circle cx="18.8" cy="13.2" r="2.1" fill={strokeColor} />
            {/* Stabilizer fins */}
            <path
              d="M11.2 13.6L7 14.2L9.2 17.8M18.4 20.8L17.8 25L14.2 22.8"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Thrust flame */}
            <path
              d="M11.5 20.5C9.8 22.2 7.2 22.8 6.5 25.5C9.2 24.8 9.8 22.2 11.5 20.5Z"
              fill={strokeColor}
            />
            <path
              d="M6.5 25.5L9.8 22.2"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'C':
        // التقليدي (Conventional): Structured Ledger & Precision Checklist
        return (
          <svg
            width={dims.svgPx}
            height={dims.svgPx}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={palette.title}
          >
            {/* Structured clipboard / ledger board */}
            <rect
              x="7"
              y="6.5"
              width="18"
              height="20.5"
              rx="3"
              fill={accentFill}
              fillOpacity={accentOpacity}
              stroke={strokeColor}
              strokeWidth="1.9"
            />
            {/* Top clip */}
            <rect
              x="12"
              y="4.5"
              width="8"
              height="3.8"
              rx="1.5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="1.8"
            />
            {/* Checkmark + data lines */}
            <path
              d="M10.5 13.5L12 15L14.5 12.2"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 13.8H21.5"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M10.5 18.8L12 20.3L14.5 17.5"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 19.1H21.5"
              stroke={strokeColor}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M10.8 23.5H21.5"
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
          </svg>
        );
    }
  };

  if (variant === 'bare') {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {renderGlyph()}
      </span>
    );
  }

  return (
    <div
      style={{
        width: `${dims.boxPx}px`,
        height: `${dims.boxPx}px`,
        backgroundColor: isSolid ? palette.secondary : palette.softBg,
        borderColor: isSolid ? palette.primary : palette.borderColor,
      }}
      className={`inline-flex items-center justify-center shrink-0 border ${dims.radiusClass} ${className}`}
      title={palette.title}
    >
      {renderGlyph()}
    </div>
  );
};

export default RiasecIcon;
