/**
 * Utility functions for WhatsApp Click-to-Chat integration (Mexico).
 */

/**
 * Formats a Mexican phone number for the wa.me API.
 * Expects 10-digit input (e.g., 5512345678).
 * Returns the number prefixed with 521 (required for MX mobiles).
 */
export function formatPhoneForWhatsApp(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");

  // 10-digit local number → add 521
  if (digits.length === 10) {
    return `521${digits}`;
  }

  // 12-digit with 52 prefix → convert to 521
  if (digits.length === 12 && digits.startsWith("52")) {
    return `521${digits.slice(2)}`;
  }

  // Already 521 format
  if (digits.length === 13 && digits.startsWith("521")) {
    return digits;
  }

  // Fallback
  return digits;
}

/**
 * Builds a WhatsApp Click-to-Chat URL.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens a WhatsApp link reliably across browsers and PWA modes.
 * Uses a hidden anchor click (best compatibility) with fallbacks.
 */
export function openWhatsAppLink(link: string): void {
  // Check if running as installed PWA
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (window.navigator as any).standalone === true;

  // iOS Safari/WebView can block cross-origin navigation when opened in a new tab/window
  // (often surfacing as: "Navigation was blocked by Cross-Origin-Opener-Policy").
  // For iOS, navigating in the SAME tab is the most reliable.
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isInIFrame = (() => {
    try {
      return window.top !== window.self;
    } catch {
      return true;
    }
  })();

  if (isStandalone || isIOS || isInIFrame) {
    // In standalone PWA, navigate directly
    window.location.href = link;
    return;
  }

  // Create a temporary anchor and click it (best popup compatibility)
  const anchor = document.createElement("a");
  anchor.href = link;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Copies text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
