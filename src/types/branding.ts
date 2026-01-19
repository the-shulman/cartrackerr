export interface BrandingConfig {
  workshopName: string;
  tagline: string;
  logoUrl?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  workshopName: "AutoTrack",
  tagline: "Workshop Service Manager",
};
