// server/middleware/validation.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors";

/**
 * Middleware factory to validate resource IDs in request parameters
 * @param paramName The name of the parameter to validate (e.g., 'projectId', 'taskId')
 * @returns Middleware function that validates the specified ID parameter
 */
export function validateResourceId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    // If param doesn't exist, let the controller handle it (might be optional in some routes)
    if (id === undefined) {
      return next();
    }
    
    // Check if ID is a valid positive integer
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ 
        message: `Invalid ${paramName} parameter: must be a positive integer.` 
      });
    }
    
    // Add the parsed ID to the request for convenience
    (req as any)[`${paramName}Num`] = idNum;
    
    next();
  };
}

/**
 * Middleware to validate project IDs in request parameters
 * This is a common case, so it's pre-defined for convenience
 */
export const validateProjectId = validateResourceId('projectId');

/**
 * Middleware to validate the 'id' parameter, typically used in routes like /resources/:id
 */
export const validateIdParam = validateResourceId('id');

/**
 * Middleware to validate task IDs in request parameters
 */
export const validateTaskId = validateResourceId('taskId');

/**
 * Middleware to validate document IDs in request parameters
 */
export const validateDocumentId = validateResourceId('documentId');

/**
 * General validation middleware for checking request body against a Zod schema
 * @param schema The Zod schema to validate against
 * @returns Middleware function that validates request body
 */
export function validateRequestBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new HttpError(400, 'Invalid request body', validationResult.error.flatten());
      }
      
      // Optional: Replace req.body with validated data
      // req.body = validationResult.data;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}