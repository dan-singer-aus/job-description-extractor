export class ExtractionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ExtractionError";
  }
}

export class ExtractionRefused extends ExtractionError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ExtractionRefused";
  }
}

export class ExtractionFailed extends ExtractionError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ExtractionFailed";
  }
}
