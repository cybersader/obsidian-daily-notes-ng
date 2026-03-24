/**
 * Manages a unique device identifier persisted in localStorage.
 * Each Obsidian installation gets its own UUID, not synced across devices.
 * Adapted from TaskNotes DeviceIdentityManager pattern.
 */
export class DeviceIdentityManager {
  private static STORAGE_KEY = 'daily-notes-ng-device-id';
  private cachedDeviceId: string | null = null;
  private cachedDeviceName: string | null = null;

  /**
   * Get or create a stable device ID (UUID v4).
   */
  getOrCreateDeviceId(): string {
    if (this.cachedDeviceId) return this.cachedDeviceId;

    let deviceId = localStorage.getItem(DeviceIdentityManager.STORAGE_KEY);
    if (!deviceId) {
      deviceId = this.generateUUID();
      localStorage.setItem(DeviceIdentityManager.STORAGE_KEY, deviceId);
    }
    this.cachedDeviceId = deviceId;
    return deviceId;
  }

  /**
   * Get a human-readable device name based on platform.
   */
  getDeviceName(): string {
    if (this.cachedDeviceName) return this.cachedDeviceName;

    const ua = navigator.userAgent;
    if (/iPad/.test(ua)) return 'iPad';
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/Android/.test(ua)) return 'Android device';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Win/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux PC';
    return 'Unknown device';
  }

  /**
   * Set a custom device name.
   */
  setDeviceName(name: string): void {
    this.cachedDeviceName = name;
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
