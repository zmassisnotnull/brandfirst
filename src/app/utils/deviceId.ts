/**
 * Device Identifier Utility
 * Generates and retrieves a unique, persistent ID for the current browser/device.
 */

const DEVICE_ID_KEY = 'brandfirst_device_id';

/**
 * Gets the current device ID from localStorage, or generates a new one if it doesn't exist.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate a new UUID
    deviceId = crypto.randomUUID?.() || generateFallbackUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🆕 Generated new device ID:', deviceId);
  }

  return deviceId;
}

/**
 * Fallback UUID generator if crypto.randomUUID is not available
 */
function generateFallbackUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
