/**
 * Custom HTTP Error class for handling API errors.
 * Provides a consistent structure for error responses.
 */
export class HttpError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    
    // Ensures proper stack trace in Node.js environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for response
   */
  toJSON() {
    return {
      status: this.status,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Validation Error - 400 Bad Request with validation details
 */
export class ValidationError extends HttpError {
  constructor(message: string, details?: any) {
    super(400, message, details);
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
export class AuthenticationError extends HttpError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
export class AuthorizationError extends HttpError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(403, message);
  }
}

/**
 * Not Found Error - 404 Not Found
 */
export class NotFoundError extends HttpError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

/**
 * Conflict Error - 409 Conflict
 */
export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}

/**
 * Server Error - 500 Internal Server Error
 */
export class ServerError extends HttpError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, message);
  }
}