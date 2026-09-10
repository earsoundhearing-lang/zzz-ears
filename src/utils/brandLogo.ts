// Helper to manage custom uploaded brand logo
const BRAND_LOGO_STORAGE_KEY = 'earsound_custom_brand_logo';
const BRAND_LOGO_EVENT = 'earsound-brand-logo-changed';

export function getCustomBrandLogo(): string | null {
  try {
    return localStorage.getItem(BRAND_LOGO_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to read custom brand logo from localStorage', e);
    return null;
  }
}

export function setCustomBrandLogo(dataUrl: string): void {
  try {
    localStorage.setItem(BRAND_LOGO_STORAGE_KEY, dataUrl);
    window.dispatchEvent(new CustomEvent(BRAND_LOGO_EVENT, { detail: dataUrl }));
  } catch (e) {
    console.error('Failed to save custom brand logo to localStorage', e);
  }
}

export function removeCustomBrandLogo(): void {
  try {
    localStorage.removeItem(BRAND_LOGO_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(BRAND_LOGO_EVENT, { detail: null }));
  } catch (e) {
    console.error('Failed to remove custom brand logo from localStorage', e);
  }
}

export function subscribeBrandLogoChange(callback: (logoUrl: string | null) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<string | null>;
    callback(customEvent.detail ?? getCustomBrandLogo());
  };
  window.addEventListener(BRAND_LOGO_EVENT, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === BRAND_LOGO_STORAGE_KEY) {
      callback(getCustomBrandLogo());
    }
  });
  return () => {
    window.removeEventListener(BRAND_LOGO_EVENT, handler);
  };
}
