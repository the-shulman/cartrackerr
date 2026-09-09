export interface BrandingConfig {
  workshopName: string;
  tagline: string;
  logoUrl?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  workshopName: "CarTrackerr",
  tagline: "Workshop Service Manager",
};
