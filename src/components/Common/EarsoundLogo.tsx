import React, { useState, useEffect } from 'react';
import { getCustomBrandLogo, subscribeBrandLogoChange } from '../../utils/brandLogo';

interface EarsoundLogoProps {
  variant?: 'dark' | 'light' | 'horizontal' | 'icon-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  forceVector?: boolean;
}

export const EarsoundLogo: React.FC<EarsoundLogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
  showSubtitle = false,
  forceVector = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(getCustomBrandLogo());
  const isDark = variant === 'dark';

  useEffect(() => {
    const unsubscribe = subscribeBrandLogoChange((newLogo) => {
      setCustomLogo(newLogo);
    });
    return unsubscribe;
  }, []);

  // Sizing map with proportional heights
  const sizeConfig = {
    sm: { iconH: 28, imgH: 'h-8 max-h-8', textH: 'text-xl', subText: 'text-[8px]', gap: 'gap-2' },
    md: { iconH: 38, imgH: 'h-10 max-h-11', textH: 'text-2xl', subText: 'text-[9px]', gap: 'gap-2.5' },
    lg: { iconH: 48, imgH: 'h-12 max-h-14', textH: 'text-3xl', subText: 'text-[10px]', gap: 'gap-3' },
    xl: { iconH: 60, imgH: 'h-16 max-h-20', textH: 'text-4xl', subText: 'text-xs', gap: 'gap-3.5' },
  }[size];

  // If a custom logo file (PNG/JPG) was uploaded by the user, render it directly
  if (customLogo && !forceVector) {
    return (
      <div className={`inline-flex items-center ${sizeConfig.gap} select-none ${className}`}>
        <img
          src={customLogo}
          alt="earsound"
          className={`${sizeConfig.imgH} w-auto object-contain rounded-lg transition-all drop-shadow-xs`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Official Brand Colors
  const iconGold = '#F5B438'; // Golden amber ear glyph matching official brand
  const brandNavy = isDark ? '#FFFFFF' : '#1E293B';
  const subColor = isDark ? '#F5B438' : '#64748B';

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} select-none ${className}`}>
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
        <div className="flex flex-col leading-none">
          <span
            className={`font-black tracking-tighter font-sans ${sizeConfig.textH}`}
            style={{ 
              color: brandNavy, 
              letterSpacing: '-0.04em',
              fontWeight: 900
            }}
          >
            earsound
          </span>
          {showSubtitle && (
            <span
              className={`font-extrabold uppercase tracking-widest mt-0.5 ${sizeConfig.subText}`}
              style={{ color: subColor }}
            >
              Hearing Care
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EarsoundLogo;
