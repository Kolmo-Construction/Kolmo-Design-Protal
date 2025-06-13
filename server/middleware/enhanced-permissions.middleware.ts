// server/middleware/enhanced-permissions.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { storage } from "@server/storage/index";
import { User } from "@shared/schema";

/**
 * Enhanced permissions middleware for project managers
 * Grants project managers full administrative control over their assigned projects
 */

export interface ProjectManagerPermissions {
  // Project management
  canViewProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  
  // Task management
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  
  // Document management
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canViewDocuments: boolean;
  
  // Communication
  canCreateProgressUpdates: boolean;
  canSendMessages: boolean;
  canViewMessages: boolean;
  
  // Financial
  canViewInvoices: boolean;
  canCreateInvoices: boolean;
  canEditInvoices: boolean;
  
  // Client management
  canViewClients: boolean;
  canCommunicateWithClients: boolean;
  
  // Milestones
  canCreateMilestones: boolean;
  canEditMilestones: boolean;
  canDeleteMilestones: boolean;
}

/**
 * Get permissions for a user on a specific project
 */
export async function getProjectPermissions(
  userId: number, 
  userRole: string, 
  projectId: number
): Promise<ProjectManagerPermissions> {
  
  // Admin has all permissions
  if (userRole.toLowerCase() === 'admin') {
    return {
      canViewProject: true,
      canEditProject: true,
      canDeleteProject: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canUploadDocuments: true,
      canDeleteDocuments: true,
      canViewDocuments: true,
      canCreateProgressUpdates: true,
      canSendMessages: true,
      canViewMessages: true,
      canViewInvoices: true,
      canCreateInvoices: true,
      canEditInvoices: true,
      canViewClients: true,
      canCommunicateWithClients: true,
      canCreateMilestones: true,
      canEditMilestones: true,
      canDeleteMilestones: true,
    };
  }
  
  // Check if user is project manager for this project
  const isProjectManager = await storage.projectManagerHasProjectAccess(userId, projectId);
  
  if (userRole.toLowerCase() === 'projectmanager' && isProjectManager) {
    // Project managers have full control over their assigned projects
    return {
      canViewProject: true,
      canEditProject: true,
      canDeleteProject: false, // Only admins can delete projects
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canUploadDocuments: true,
      canDeleteDocuments: true,
      canViewDocuments: true,
      canCreateProgressUpdates: true,
      canSendMessages: true,
      canViewMessages: true,
      canViewInvoices: true,
      canCreateInvoices: true,
      canEditInvoices: true,
      canViewClients: true,
      canCommunicateWithClients: true,
      canCreateMilestones: true,
      canEditMilestones: true,
      canDeleteMilestones: true,
    };
  }
  
  // Check if user is client for this project
  const isClient = await storage.clientHasProjectAccess(userId, projectId);
  
  if (userRole.toLowerCase() === 'client' && isClient) {
    // Clients have limited permissions
    return {
      canViewProject: true,
      canEditProject: false,
      canDeleteProject: false,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canAssignTasks: false,
      canUploadDocuments: false,
      canDeleteDocuments: false,
      canViewDocuments: true,
      canCreateProgressUpdates: false,
      canSendMessages: true,
      canViewMessages: true,
      canViewInvoices: true,
      canCreateInvoices: false,
      canEditInvoices: false,
      canViewClients: false,
      canCommunicateWithClients: false,
      canCreateMilestones: false,
      canEditMilestones: false,
      canDeleteMilestones: false,
    };
  }
  
  // No access by default
  return {
    canViewProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canAssignTasks: false,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canViewDocuments: false,
    canCreateProgressUpdates: false,
    canSendMessages: false,
    canViewMessages: false,
    canViewInvoices: false,
    canCreateInvoices: false,
    canEditInvoices: false,
    canViewClients: false,
    canCommunicateWithClients: false,
    canCreateMilestones: false,
    canEditMilestones: false,
    canDeleteMilestones: false,
  };
}

/**
 * Enhanced project access check with detailed permissions
 */
export async function checkEnhancedProjectAccess(
  req: Request, 
  res: Response, 
  projectId: number,
  requiredPermission?: keyof ProjectManagerPermissions
): Promise<boolean> {
  
  // Ensure user is authenticated
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  
  const user = req.user as User;
  const permissions = await getProjectPermissions(user.id, user.role, projectId);
  
  // If no specific permission required, just check if user has any access to the project
  if (!requiredPermission) {
    if (!permissions.canViewProject) {
      res.status(403).json({ message: "Forbidden: You do not have access to this project." });
      return false;
    }
    return true;
  }
  
  // Check specific permission
  if (!permissions[requiredPermission]) {
    res.status(403).json({ 
      message: `Forbidden: You do not have permission to perform this action on this project.`,
      requiredPermission,
      userRole: user.role
    });
    return false;
  }
  
  return true;
}

/**
 * Middleware factory for project-specific permissions
 */
export function requireProjectPermission(permission?: keyof ProjectManagerPermissions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const projectId = parseInt(req.params.projectId, 10);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const hasAccess = await checkEnhancedProjectAccess(req, res, projectId, permission);
    
    if (hasAccess) {
      // Add permissions to request for use in controllers
      const user = req.user as User;
      const permissions = await getProjectPermissions(user.id, user.role, projectId);
      (req as any).projectPermissions = permissions;
      next();
    }
    // If false, checkEnhancedProjectAccess already sent the response
  };
}

/**
 * Check if user can perform administrative actions on a project
 */
export async function canAdministerProject(userId: number, userRole: string, projectId: number): Promise<boolean> {
  if (userRole.toLowerCase() === 'admin') {
    return true;
  }
  
  if (userRole.toLowerCase() === 'projectmanager') {
    return await storage.projectManagerHasProjectAccess(userId, projectId);
  }
  
  return false;
}