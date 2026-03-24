import * as chrono from 'chrono-node';

/**
 * Natural language date parser using chrono-node.
 * Parses expressions like "next friday", "in 3 days", "last month".
 */
export class DateParser {
  private parser: chrono.Chrono;

  constructor() {
    this.parser = chrono.casual.clone();
    // TODO: Add custom refiners/parsers if needed
  }

  /**
   * Parse a natural language date string.
   */
  parse(text: string, referenceDate?: Date): DateParseResult | null {
    const results = this.parser.parse(text, referenceDate);
    if (results.length === 0) return null;

    const result = results[0];
    return {
      date: result.start.date(),
      text: result.text,
      index: result.index,
    };
  }

  /**
   * Parse all date references in a string.
   */
  parseAll(text: string, referenceDate?: Date): DateParseResult[] {
    return this.parser.parse(text, referenceDate).map(result => ({
      date: result.start.date(),
      text: result.text,
      index: result.index,
    }));
  }
}

export interface DateParseResult {
  date: Date;
  text: string;
  index: number;
}
