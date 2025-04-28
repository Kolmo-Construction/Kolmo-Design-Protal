import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertProgressUpdateSchema, User } from '../../shared/schema';
import { HttpError } from '../errors';

// --- Zod Schemas for API Input Validation ---

// Schema for creating a progress update
const progressUpdateCreateSchema = insertProgressUpdateSchema.omit({
  id: true,
  projectId: true, // Set from route parameter
  createdAt: true,
  updatedAt: true,
  createdBy: true, // Set from authenticated user
});

// --- Controller Functions ---

/**
 * Get all progress updates for a specific project.
 * Access control checked in the controller.
 */
export const getProjectUpdates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId, 10);
    const user = req.user as User;

    if (isNaN(projectIdNum)) {
      throw new HttpError(400, 'Invalid project ID parameter.');
    }
    if (!user?.id) {
      throw new HttpError(401, 'Authentication required.');
    }

    // Check if user has access to this project
    const hasAccess = await storage.checkUserProjectAccess(user.id, projectIdNum);
    if (!hasAccess && user.role !== 'admin') {
      throw new HttpError(403, 'You do not have permission to access updates for this project.');
    }

    // Fetch progress updates
    const updates = await storage.getProgressUpdatesForProject(projectIdNum);
    res.status(200).json(updates);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new progress update for a specific project.
 * Access control checked in the controller.
 */
export const createProjectUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId, 10);
    const user = req.user as User;

    if (isNaN(projectIdNum)) {
      throw new HttpError(400, 'Invalid project ID parameter.');
    }
    if (!user?.id) {
      throw new HttpError(401, 'Authentication required.');
    }

    // Check if user has appropriate role
    const isAuthorized = user.role === 'admin' || user.role === 'projectManager';
    if (!isAuthorized) {
      // If not admin/PM, check if user has specific project permissions
      const hasAccess = await storage.checkUserProjectAccess(user.id, projectIdNum);
      if (!hasAccess) {
        throw new HttpError(403, 'You do not have permission to create updates for this project.');
      }
    }

    // Validate request data
    const validationResult = progressUpdateCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new HttpError(400, 'Invalid progress update data.', validationResult.error.flatten());
    }

    // Prepare data for storage
    const updateData = {
      ...validationResult.data,
      projectId: projectIdNum,
      createdBy: user.id,
    };

    // Create the progress update
    const createdUpdate = await storage.createProgressUpdate(updateData);
    
    res.status(201).json(createdUpdate);
  } catch (error) {
    next(error);
  }
};