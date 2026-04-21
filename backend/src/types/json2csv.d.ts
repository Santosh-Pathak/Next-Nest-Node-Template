declare module 'json2csv' {
  export class Parser {
    constructor(options?: { fields?: string[] });
    parse(data: Record<string, unknown>[]): string;
  }
}
