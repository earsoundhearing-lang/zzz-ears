import React, { useState, useEffect } from 'react';
import { getCustomBrandLogo, subscribeBrandLogoChange } from '../../utils/brandLogo';

interface EarsoundLogoProps {
  variant?: 'dark' | 'light' | 'icon-only' | 'plain';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  forceVector?: boolean;
}

export const EarsoundLogo: React.FC<EarsoundLogoProps> = ({
  variant = 'dark',
  size = 'md',
  className = '',
  showSubtitle = false,
  subtitleText = 'Management Information System',
  forceVector = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(getCustomBrandLogo());

  useEffect(() => {
    const unsubscribe = subscribeBrandLogoChange((newLogo) => {
      setCustomLogo(newLogo);
    });
    return unsubscribe;
  }, []);

  // Proportional sizing configuration (substantially larger for clear visibility)
  const sizeConfig = {
    sm: { iconH: 32, imgH: 'h-9 max-h-9', textH: 'text-2xl', subText: 'text-xs', gap: 'gap-2.5' },
    md: { iconH: 44, imgH: 'h-12 max-h-12', textH: 'text-3xl sm:text-4xl', subText: 'text-sm', gap: 'gap-3' },
    lg: { iconH: 60, imgH: 'h-16 max-h-16', textH: 'text-4xl sm:text-5xl', subText: 'text-base', gap: 'gap-4' },
    xl: { iconH: 76, imgH: 'h-20 max-h-20', textH: 'text-5xl sm:text-6xl', subText: 'text-lg', gap: 'gap-5' },
  }[size];

  // Text color based on background variant
  const textColor = variant === 'light' ? 'text-[#181B57]' : 'text-white';
  const subtitleColor = variant === 'light' ? 'text-slate-600' : 'text-[#7A88E0]';

  // If a custom logo file (PNG/JPG) was uploaded by the user, render it directly
  if (customLogo && !forceVector) {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <div className={`inline-flex items-center ${sizeConfig.gap}`}>
          <img
            src={customLogo}
            alt="earsound"
            className={`${sizeConfig.imgH} w-auto object-contain rounded-lg transition-all drop-shadow-xs`}
            referrerPolicy="no-referrer"
          />
        </div>
        {showSubtitle && (
          <span className={`font-semibold ${subtitleColor} tracking-wide mt-2 text-center ${sizeConfig.subText}`}>
            {subtitleText}
          </span>
        )}
      </div>
    );
  }

  // Official Brand Colors
  const iconGold = '#F5B438'; // Golden amber ear glyph matching official brand

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Main Logo Container without background box constraints */}
      <div className={`inline-flex items-center ${sizeConfig.gap}`}>
        {/* Official Earsound Golden Ear Monogram Icon */}
        <svg
          height={sizeConfig.iconH}
          viewBox="0 0 100 105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-xs"
        >
          {/* Continuous single-stroke spiral ear matching the official Earsound brand identity */}
          <path
            d="M 32 94
               C 18 94, 10 78, 10 60
               C 10 32, 30 10, 58 10
               C 84 10, 92 34, 92 56
               C 92 80, 74 94, 52 94
               C 32 94, 24 76, 24 58
               C 24 40, 36 30, 52 30
               C 66 30, 72 40, 72 52
               C 72 64, 62 70, 50 70
               C 42 70, 36 64, 38 54
               C 39 48, 46 46, 52 48"
            stroke={iconGold}
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Official Earsound Logotype */}
        {variant !== 'icon-only' && (
          <span
            className={`tracking-tight ${textColor} leading-none select-none ${sizeConfig.textH}`}
            style={{ 
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              letterSpacing: '-0.03em',
              fontWeight: 800,
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            earsound
          </span>
        )}
      </div>

      {/* Subtitle ("Management Information System" / "Hearing Care") */}
      {showSubtitle && (
        <span className={`font-semibold ${subtitleColor} tracking-wide mt-2 text-center ${sizeConfig.subText}`}>
          {subtitleText}
        </span>
      )}
    </div>
  );
};

export default EarsoundLogo;
