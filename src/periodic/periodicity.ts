export type Periodicity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const ALL_PERIODICITIES: Periodicity[] = [
  'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
];

export const PERIODICITY_LABELS: Record<Periodicity, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};
