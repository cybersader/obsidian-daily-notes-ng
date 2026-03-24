import { DevicePreferences } from '../../src/identity/DevicePreferences';

describe('DevicePreferences', () => {
  let prefs: DevicePreferences;

  beforeEach(() => {
    localStorage.removeItem('daily-notes-ng-device-prefs');
    prefs = new DevicePreferences();
  });

  test('get returns empty object when no data stored', () => {
    expect(prefs.get()).toEqual({});
  });

  test('set persists data to localStorage', () => {
    prefs.set({ deviceName: 'Test PC' });
    expect(prefs.get().deviceName).toBe('Test PC');
  });

  test('set merges with existing data', () => {
    prefs.set({ deviceName: 'Test PC' });
    prefs.set({ periodicOverrides: { daily: { folder: 'Custom/Daily' } } });
    const data = prefs.get();
    expect(data.deviceName).toBe('Test PC');
    expect(data.periodicOverrides?.daily?.folder).toBe('Custom/Daily');
  });

  test('clear removes all data', () => {
    prefs.set({ deviceName: 'Test PC' });
    prefs.clear();
    expect(prefs.get()).toEqual({});
  });

  test('getPeriodicOverride returns undefined when no overrides', () => {
    expect(prefs.getPeriodicOverride('daily')).toBeUndefined();
  });

  test('setPeriodicOverride stores and retrieves override', () => {
    prefs.setPeriodicOverride('daily', { folder: 'My/Daily' });
    expect(prefs.getPeriodicOverride('daily')).toEqual({ folder: 'My/Daily' });
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('daily-notes-ng-device-prefs', 'not json');
    const freshPrefs = new DevicePreferences();
    expect(freshPrefs.get()).toEqual({});
  });
});
