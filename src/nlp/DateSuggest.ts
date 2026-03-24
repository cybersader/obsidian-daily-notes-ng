import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';
import { DateParser } from './DateParser';

/**
 * EditorSuggest that triggers on the configured trigger character (default @)
 * and suggests date completions using natural language parsing.
 */
export class DateSuggest extends EditorSuggest<DateSuggestion> {
  private settings: DailyNotesNGSettings;
  private parser: DateParser;

  constructor(app: App, settings: DailyNotesNGSettings) {
    super(app);
    this.settings = settings;
    this.parser = new DateParser();
  }

  onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const triggerChar = this.settings.nlp.triggerChar;
    const lastTrigger = line.lastIndexOf(triggerChar, cursor.ch - 1);

    if (lastTrigger === -1) return null;

    const query = line.substring(lastTrigger + triggerChar.length, cursor.ch);
    if (query.length < 2) return null;

    return {
      start: { line: cursor.line, ch: lastTrigger },
      end: cursor,
      query,
    };
  }

  getSuggestions(context: EditorSuggestContext): DateSuggestion[] {
    const result = this.parser.parse(context.query);
    if (!result) return [];

    const m = (window as any).moment(result.date);
    const formatted = m.format(this.settings.nlp.dateFormat);

    return [{
      display: `${context.query} → ${formatted}`,
      date: m,
      formatted,
    }];
  }

  renderSuggestion(suggestion: DateSuggestion, el: HTMLElement): void {
    el.setText(suggestion.display);
  }

  selectSuggestion(suggestion: DateSuggestion, _evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) return;

    const replacement = this.settings.nlp.insertAsLink
      ? `[[${suggestion.formatted}]]`
      : suggestion.formatted;

    this.context.editor.replaceRange(
      replacement,
      this.context.start,
      this.context.end
    );
  }
}

export interface DateSuggestion {
  display: string;
  date: moment.Moment;
  formatted: string;
}
