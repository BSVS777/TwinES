/** Base class for failures the delivery layer maps to HTTP status codes. */
export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 400: one or more input fields are invalid. `errors` maps field name to message. */
export class ValidationError extends ApplicationError {
  constructor(public readonly errors: Record<string, string>) {
    super("Validation failed");
  }
}

/** 401: the caller is not authenticated or the credentials are wrong. */
export class Unauthorized extends ApplicationError {
  constructor(message = "Authentication required") {
    super(message);
  }
}

/** 403: the caller is authenticated but not allowed to do this. */
export class Forbidden extends ApplicationError {
  constructor(message = "Forbidden") {
    super(message);
  }
}

/** 404: the resource does not exist or is not visible to the caller. */
export class NotFound extends ApplicationError {
  constructor(message = "Not found") {
    super(message);
  }
}

/** 409: a unique value (email or plate) is already taken. `field` names the colliding input. */
export class Conflict extends ApplicationError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
  }
}

/** 429: sign-in is temporarily locked after repeated failures. */
export class TooManyAttempts extends ApplicationError {
  constructor(public readonly lockedUntil?: Date) {
    super("Too many attempts");
  }
}
