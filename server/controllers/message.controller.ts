import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { MessageWithSender } from '../storage/types';
import { insertMessageSchema, User } from '../../shared/schema';
import { HttpError } from '../errors';
import { sendNewMessageNotification } from '../services/notification.service'; // Import the new service
import { log as logger } from '@server/vite'; // Use logger

// Zod Schema for API Input Validation (using content field from schema)
const messageCreateSchema = insertMessageSchema.pick({
  subject: true, // Added subject based on schema
  message: true, // Renamed from content to message based on schema
  recipientId: true, // Added recipientId based on schema (optional)
}).refine(data => data.message.trim().length > 0, {
  message: "Message content cannot be empty.",
  path: ["message"], // Updated path
}).refine(data => data.subject.trim().length > 0, { // Added validation for subject
    message: "Subject cannot be empty.",
    path: ["subject"],
});


/**
 * Get all messages for a specific project.
 */
export const getMessagesForProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId, 10);

    if (isNaN(projectIdNum)) {
      throw new HttpError(400, 'Invalid project ID parameter.');
    }

    logger(`[MessageController] Fetching messages for project ID: ${projectIdNum}`, 'Message');
    const messages = await storage.messages.getMessagesForProject(projectIdNum);
    logger(`[MessageController] Found ${messages.length} messages for project ID: ${projectIdNum}`, 'Message');
    res.status(200).json(messages);
  } catch (error) {
     logger(`[MessageController] Error in getMessagesForProject: ${error instanceof Error ? error.message : String(error)}`, 'MessageError');
    next(error);
  }
};

/**
 * Create a new message within a project thread.
 */
export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId, 10);
    const user = req.user as User; // Assuming isAuthenticated middleware sets req.user

    if (isNaN(projectIdNum)) { throw new HttpError(400, 'Invalid project ID parameter.'); }
    if (!user?.id) { throw new HttpError(401, 'Authentication required.'); }

    const validationResult = messageCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger(`[MessageController] Validation failed: ${JSON.stringify(validationResult.error.flatten())}`, 'MessageError');
      throw new HttpError(400, 'Invalid message data.', validationResult.error.flatten());
    }
    // Use validated data, matching the schema fields
    const { subject, message, recipientId } = validationResult.data;

    const newMessageData = {
        projectId: projectIdNum,
        senderId: user.id,
        subject: subject,
        message: message,
        recipientId: recipientId, // Include recipientId (can be null/undefined)
        // isRead defaults to false in DB
    };

    logger(`[MessageController] Creating message for project ${projectIdNum} by user ${user.id}`, 'Message');
    const createdMessage = await storage.messages.createMessage(newMessageData);

    if (!createdMessage) {
        logger(`[MessageController] Failed to create message in repository.`, 'MessageError');
        throw new HttpError(500, 'Failed to create message.');
    }

    logger(`[MessageController] Message ${createdMessage.id} created successfully. Responding and triggering notification.`, 'Message');
    // Respond immediately
    res.status(201).json(createdMessage); // Returns MessageWithSender type

    // --- Trigger Notification Asynchronously ---
    // Use setTimeout to avoid blocking the response. For higher load, consider a job queue.
    setTimeout(() => {
        sendNewMessageNotification(createdMessage)
            .catch(err => logger(`[MessageController] Error sending message notification asynchronously: ${err instanceof Error ? err.message : String(err)}`, 'NotificationError'));
    }, 0);
    // --- End Notification Trigger ---

  } catch (error) {
     logger(`[MessageController] Error in createMessage: ${error instanceof Error ? error.message : String(error)}`, 'MessageError');
    next(error); // Pass to error handler
  }
};
