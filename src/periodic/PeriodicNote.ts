import type { TFile } from 'obsidian';
import type { Periodicity } from './periodicity';

/**
 * Represents a single periodic note with its metadata.
 */
export interface PeriodicNote {
  file: TFile;
  date: moment.Moment;
  periodicity: Periodicity;
}
