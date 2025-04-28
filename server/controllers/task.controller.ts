import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import {
  insertTaskSchema,
  insertTaskDependencySchema,
  User,
} from '../../shared/schema';
import { HttpError } from '../errors';

// --- Zod Schemas for API Input Validation ---

// Schema for creating a task (omits server-set fields)
const taskCreateSchema = insertTaskSchema.omit({
  id: true,
  projectId: true, // Set from route parameter
  createdBy: true, // Set from authenticated user
  createdAt: true,
  updatedAt: true,
  // completedAt handled by status change potentially
});

// Schema for updating a task (most fields optional)
const taskUpdateSchema = taskCreateSchema.partial().extend({
    // If status is being updated, completedAt might need specific handling logic
    status: taskCreateSchema.shape.status.optional(),
});

// Schema for adding a dependency (expects numeric IDs from client)
const taskDependencySchema = z.object({
    predecessorId: z.number().int().positive(),
    successorId: z.number().int().positive(),
});


// --- Controller Functions ---

/**
 * Get all tasks for a specific project.
 * Assumes checkProjectAccess middleware runs before this.
 */
export const getProjectTasks = async (
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

    // checkProjectAccess middleware verified access
    const tasks = await storage.getProjectTasks(projectIdNum);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all task dependencies for a project.
 * This endpoint fetches all task dependencies involving tasks from this project.
 */
export const getProjectTaskDependencies = async (
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

    // First get all tasks for this project to get their IDs
    const tasks = await storage.getProjectTasks(projectIdNum);
    const taskIds = tasks.map(task => task.id);
    
    // If there are no tasks, return empty array
    if (taskIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get all dependencies that involve these tasks
    const dependencies = await storage.getProjectTaskDependencies(projectIdNum, taskIds);
    res.status(200).json(dependencies);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task within a project.
 * Assumes checkProjectAccess middleware runs before this.
 */
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId, 10);
    const user = req.user as User; // Authenticated user

    if (isNaN(projectIdNum)) {
      throw new HttpError(400, 'Invalid project ID parameter.');
    }
    if (!user?.id) {
       throw new HttpError(401, 'Authentication required.'); // Should be caught by middleware, but belts-and-suspenders
    }

    const validationResult = taskCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new HttpError(400, 'Invalid task data.', validationResult.error.flatten());
    }

    const validatedData = validationResult.data;

    // Prepare data for storage layer
    const newTaskData = {
        ...validatedData,
        projectId: projectIdNum,
        createdBy: user.id,
        // Ensure dates are Date objects if storage layer expects them
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
    };

    const createdTask = await storage.createTask(newTaskData); // Assumes storage.createTask exists
    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing task.
 * Assumes checkProjectAccess middleware runs before this (for the project).
 */
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, taskId } = req.params;
    const projectIdNum = parseInt(projectId, 10);
    const taskIdNum = parseInt(taskId, 10);

    if (isNaN(projectIdNum) || isNaN(taskIdNum)) {
      throw new HttpError(400, 'Invalid project or task ID parameter.');
    }

    // checkProjectAccess middleware verified access to the project

    const validationResult = taskUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new HttpError(400, 'Invalid task data.', validationResult.error.flatten());
    }

    const validatedData = validationResult.data;
    if (Object.keys(validatedData).length === 0) {
      throw new HttpError(400, 'No update data provided.');
    }

     // Prepare data, converting dates if necessary
     const updateData = {
        ...validatedData,
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
        ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
        // Potential logic: if status changes to 'COMPLETED', set completedAt
        ...(validatedData.status === 'COMPLETED' && { completedAt: new Date() }),
        ...(validatedData.status !== 'COMPLETED' && validatedData.status !== undefined && { completedAt: null }) // Clear if moved away from completed
    };


    // Storage layer should ideally verify task belongs to project before updating
    const updatedTask = await storage.updateTask(taskIdNum, updateData); // Assumes storage.updateTask exists

    if (!updatedTask) {
      // This implies task with taskIdNum wasn't found
      throw new HttpError(404, 'Task not found.');
    }

    // Optional: Verify task actually belongs to project if storage doesn't guarantee it
    // if (updatedTask.projectId !== projectIdNum) {
    //    throw new HttpError(403, 'Task does not belong to the specified project.');
    // }


    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task.
 * Assumes checkProjectAccess middleware runs before this (for the project).
 */
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, taskId } = req.params;
    const projectIdNum = parseInt(projectId, 10);
    const taskIdNum = parseInt(taskId, 10);

    if (isNaN(projectIdNum) || isNaN(taskIdNum)) {
      throw new HttpError(400, 'Invalid project or task ID parameter.');
    }

    // checkProjectAccess middleware verified access to the project

    // Storage layer should ideally verify task belongs to project before deleting
    const success = await storage.deleteTask(taskIdNum); // Assumes storage.deleteTask exists

    if (!success) {
      // Task not found or delete failed
      throw new HttpError(404, 'Task not found or could not be deleted.');
    }

    res.status(204).send(); // No content on successful delete
  } catch (error) {
    next(error);
  }
};

/**
 * Add a dependency between two tasks.
 * NOTE: Authorization needs careful consideration here as routes are not project-nested.
 * This implementation assumes the user has implicit rights if they can interact with tasks.
 * A more robust solution would check project access for both tasks involved.
 */
export const createTaskDependency = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { projectId, successorId } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const successorIdNum = parseInt(successorId, 10);

        if (isNaN(projectIdNum) || isNaN(successorIdNum)) {
            throw new HttpError(400, 'Invalid project or successor task ID parameter.');
        }

        // Assuming IDs are sent as numbers in the body
        const validationResult = taskDependencySchema.safeParse(req.body);
        if (!validationResult.success) {
             throw new HttpError(400, 'Invalid dependency data. Expecting { predecessorId: number, successorId: number }.', validationResult.error.flatten());
        }

        const { predecessorId } = validationResult.data;
        if (predecessorId === successorIdNum) {
             throw new HttpError(400, 'Task cannot depend on itself.');
        }

        // **AUTHORIZATION NOTE:**
        // Need to determine required permissions. Can any user who can see the tasks link them?
        // Or does the user need specific write access to the project(s) containing these tasks?
        // Fetching both tasks and checking permissions against req.user would be robust.
        // For now, proceed and let storage handle potential "task not found" errors.
        // const task1Project = await storage.getTaskProjectId(predecessorId); // Hypothetical storage method
        // const task2Project = await storage.getTaskProjectId(successorId);
        // await checkAccessLogic(req.user, task1Project); // Hypothetical check
        // await checkAccessLogic(req.user, task2Project);

        const dependency = await storage.createTaskDependency({
            predecessorId,
            successorId: successorIdNum,
            type: req.body.type || "FS" // Default to Finish-to-Start if not specified
        });

        res.status(201).json(dependency);

    } catch(error) {
        // Handle specific errors like "dependency exists", "cycle detected", "task not found" from storage if possible
        next(error);
    }
};


/**
 * Delete a task dependency by its ID.
 * NOTE: Authorization needs careful consideration here.
 */
export const deleteTaskDependency = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { projectId, dependencyId } = req.params;
        const projectIdNum = parseInt(projectId, 10);
        const dependencyIdNum = parseInt(dependencyId, 10);

        if (isNaN(projectIdNum) || isNaN(dependencyIdNum)) {
            throw new HttpError(400, 'Invalid project or dependency ID parameter.');
        }

        // checkProjectAccess middleware verified access to the project

        await storage.deleteTaskDependency(dependencyIdNum);
        
        res.status(204).send(); // No content on successful delete

    } catch(error) {
        next(error);
    }
};