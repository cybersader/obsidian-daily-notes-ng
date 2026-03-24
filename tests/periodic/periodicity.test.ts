import { ALL_PERIODICITIES, PERIODICITY_LABELS, Periodicity } from '../../src/periodic/periodicity';

describe('periodicity', () => {
  test('ALL_PERIODICITIES contains all five types', () => {
    expect(ALL_PERIODICITIES).toEqual(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
  });

  test('PERIODICITY_LABELS has labels for all types', () => {
    for (const p of ALL_PERIODICITIES) {
      expect(PERIODICITY_LABELS[p]).toBeDefined();
      expect(typeof PERIODICITY_LABELS[p]).toBe('string');
    }
  });

  test('Periodicity type accepts valid values', () => {
    const valid: Periodicity[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    expect(valid.length).toBe(5);
  });
});
