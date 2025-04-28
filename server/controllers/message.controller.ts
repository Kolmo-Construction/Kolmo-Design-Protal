import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertMessageSchema, User } from '../../shared/schema';
import { HttpError } from '../errors';

// --- Zod Schemas for API Input Validation ---

// Schema for creating a message
const messageCreateSchema = insertMessageSchema.omit({
  id: true,
  projectId: true, // Set from route parameter
  createdAt: true,
  updatedAt: true,
  createdBy: true, // Set from authenticated user
});

// --- Controller Functions ---

/**
 * Get all messages for a specific project.
 * Access control checked in the controller.
 */
export const getProjectMessages = async (
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
      throw new HttpError(403, 'You do not have permission to access messages for this project.');
    }

    // Fetch messages, possibly with pagination support
    const messages = await storage.getMessagesForProject(projectIdNum);
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new message for a specific project.
 * Access control checked in the controller.
 */
export const createProjectMessage = async (
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
      throw new HttpError(403, 'You do not have permission to create messages for this project.');
    }

    // Validate request data
    const validationResult = messageCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new HttpError(400, 'Invalid message data.', validationResult.error.flatten());
    }

    // Prepare data for storage
    const messageData = {
      ...validationResult.data,
      projectId: projectIdNum,
      createdBy: user.id,
    };

    // Create the message
    const createdMessage = await storage.createMessage(messageData);
    
    res.status(201).json(createdMessage);
  } catch (error) {
    next(error);
  }
};