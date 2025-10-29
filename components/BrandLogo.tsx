import React, { useState, useEffect } from 'react';
import { BRANDS } from '../utils/brandData';

interface BrandLogoProps {
  brandName: string;
  className?: string;
}

// Create a memoized map for faster, case-insensitive lookups
const brandMap = new Map(BRANDS.map(b => [b.name.toLowerCase(), b]));

export const BrandLogo: React.FC<BrandLogoProps> = ({ brandName, className = 'h-8 w-8' }) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state on brand change to allow a new image to load
    setHasError(false);

    if (!brandName) {
      setLogoSrc(null);
      return;
    }

    // Find brand info from our curated list (case-insensitive)
    const brandInfo = brandMap.get(brandName.toLowerCase());

    if (brandInfo?.domain) {
      // Use the reliable Clearbit service with the curated domain
      const src = `https://logo.clearbit.com/${brandInfo.domain}`;
      setLogoSrc(src);
    } else {
      // If we don't know the brand, we can't fetch a logo.
      // This will trigger the fallback UI immediately.
      setLogoSrc(null);
    }
  }, [brandName]);

  const showImage = logoSrc && !hasError;

  return (
    <div className={`flex items-center justify-center bg-slate-200/10 p-1 rounded-sm shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={logoSrc}
          alt={`${brandName} logo`}
          className="h-full w-full object-contain"
          // If the image fails to load (e.g., 404 from Clearbit), trigger our fallback UI.
          onError={() => setHasError(true)}
        />
      ) : (
        // Fallback UI: A clean display of the brand's first initial.
        <span className="font-bold text-slate-400 text-xl select-none">
          {brandName ? brandName.charAt(0).toUpperCase() : '?'}
        </span>
      )}
    </div>
  );
};
