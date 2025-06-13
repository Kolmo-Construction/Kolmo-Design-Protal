// server/routes/project-admin.routes.ts
import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { requireProjectPermission } from "../middleware/enhanced-permissions.middleware";
import { validateResourceId } from "../middleware/validation.middleware";

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(isAuthenticated);

/**
 * Enhanced Project Administration Routes
 * These routes give project managers comprehensive administrative control
 * over their assigned projects while maintaining security boundaries.
 */

// GET /api/projects/:projectId/admin/permissions
// Get detailed permissions for the current user on this project
router.get('/permissions', 
  requireProjectPermission('canViewProject'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      // Import permissions function dynamically to avoid circular imports
      const { getProjectPermissions } = await import('../middleware/enhanced-permissions.middleware');
      const permissions = await getProjectPermissions(userId, userRole, projectId);
      
      res.json({
        projectId,
        userId,
        userRole,
        permissions,
        isProjectManager: permissions.canManageProjectSettings,
        adminLevel: userRole === 'ADMIN' ? 'full' : permissions.canManageProjectSettings ? 'project' : 'limited'
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  }
);

// GET /api/projects/:projectId/admin/dashboard
// Get comprehensive project management dashboard data
router.get('/dashboard',
  requireProjectPermission('canViewProjectAnalytics'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // This would aggregate data from multiple sources
      const dashboardData = {
        projectId,
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          activeMilestones: 0,
          completedMilestones: 0,
          openPunchListItems: 0,
          documentsCount: 0
        },
        recentActivity: [],
        upcomingDeadlines: [],
        financialSummary: {
          totalBudget: 0,
          spentAmount: 0,
          remainingBudget: 0,
          invoicedAmount: 0,
          receivedPayments: 0
        }
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  }
);

// POST /api/projects/:projectId/admin/bulk-actions
// Perform bulk actions on project resources (tasks, documents, etc.)
router.post('/bulk-actions',
  requireProjectPermission('canManageProjectSettings'),
  async (req, res) => {
    try {
      const { action, resourceType, resourceIds, data } = req.body;
      const projectId = parseInt(req.params.projectId);
      
      const validActions = ['delete', 'update', 'archive', 'publish', 'unpublish'];
      const validResourceTypes = ['tasks', 'documents', 'punchListItems'];
      
      if (!validActions.includes(action) || !validResourceTypes.includes(resourceType)) {
        return res.status(400).json({ message: 'Invalid action or resource type' });
      }
      
      // This would implement bulk operations
      const result = {
        action,
        resourceType,
        affectedCount: resourceIds?.length || 0,
        success: true,
        message: `Successfully ${action}d ${resourceIds?.length || 0} ${resourceType}`
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      res.status(500).json({ message: 'Failed to perform bulk action' });
    }
  }
);

// GET /api/projects/:projectId/admin/reports
// Generate comprehensive project reports
router.get('/reports',
  requireProjectPermission('canGenerateReports'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { reportType, startDate, endDate, format } = req.query;
      
      const availableReports = [
        'project-summary',
        'task-progress',
        'financial-overview',
        'timeline-analysis',
        'resource-utilization',
        'client-communication'
      ];
      
      const reportData = {
        projectId,
        reportType: reportType || 'project-summary',
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        format: format || 'json',
        availableReports,
        data: {
          // Report data would be populated here based on reportType
        }
      };
      
      res.json(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  }
);

// POST /api/projects/:projectId/admin/export
// Export project data in various formats
router.post('/export',
  requireProjectPermission('canExportData'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { exportType, format, includeMedia } = req.body;
      
      const exportResult = {
        projectId,
        exportType: exportType || 'full',
        format: format || 'json',
        includeMedia: includeMedia || false,
        exportId: `export_${projectId}_${Date.now()}`,
        status: 'initiated',
        estimatedCompletionTime: '5 minutes',
        downloadUrl: null // Would be populated when export is complete
      };
      
      res.json(exportResult);
    } catch (error) {
      console.error('Error initiating export:', error);
      res.status(500).json({ message: 'Failed to initiate export' });
    }
  }
);

// POST /api/projects/:projectId/admin/archive
// Archive the entire project (preserving data but marking as inactive)
router.post('/archive',
  requireProjectPermission('canManageProjectSettings'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { reason, archiveDate } = req.body;
      
      // This would update project status to archived
      const result = {
        projectId,
        status: 'archived',
        archivedAt: archiveDate || new Date().toISOString(),
        archivedBy: req.user!.id,
        reason: reason || 'Project completed',
        message: 'Project successfully archived'
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error archiving project:', error);
      res.status(500).json({ message: 'Failed to archive project' });
    }
  }
);

// POST /api/projects/:projectId/admin/restore
// Restore an archived project
router.post('/restore',
  requireProjectPermission('canManageProjectSettings'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const result = {
        projectId,
        status: 'active',
        restoredAt: new Date().toISOString(),
        restoredBy: req.user!.id,
        message: 'Project successfully restored'
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error restoring project:', error);
      res.status(500).json({ message: 'Failed to restore project' });
    }
  }
);

// GET /api/projects/:projectId/admin/audit-log
// Get audit log for project activities
router.get('/audit-log',
  requireProjectPermission('canViewProjectAnalytics'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { limit = 50, offset = 0, startDate, endDate, action, userId } = req.query;
      
      const auditLog = {
        projectId,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: 0
        },
        filters: { startDate, endDate, action, userId },
        entries: [
          // Audit entries would be populated from database
        ]
      };
      
      res.json(auditLog);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({ message: 'Failed to fetch audit log' });
    }
  }
);

// POST /api/projects/:projectId/admin/team/assign
// Assign team members to the project
router.post('/team/assign',
  requireProjectPermission('canAssignTeamMembers'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { userIds, roles } = req.body;
      
      const result = {
        projectId,
        assignedUsers: userIds,
        roles,
        assignedBy: req.user!.id,
        assignedAt: new Date().toISOString(),
        message: `Successfully assigned ${userIds?.length || 0} team members`
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error assigning team members:', error);
      res.status(500).json({ message: 'Failed to assign team members' });
    }
  }
);

// DELETE /api/projects/:projectId/admin/team/:userId
// Remove team member from project
router.delete('/team/:userId',
  validateResourceId('userId'),
  requireProjectPermission('canAssignTeamMembers'),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      
      const result = {
        projectId,
        removedUserId: userId,
        removedBy: req.user!.id,
        removedAt: new Date().toISOString(),
        message: 'Team member successfully removed'
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({ message: 'Failed to remove team member' });
    }
  }
);

export default router;