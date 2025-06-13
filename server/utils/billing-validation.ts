// server/utils/billing-validation.ts
import { storage } from '../storage/index';
import { HttpError } from '../errors';

/**
 * Validates that billing percentages don't exceed 100% of project budget
 */
export class BillingValidator {
  /**
   * Calculate total billing percentage for a project from tasks and milestones
   */
  static async calculateTotalBillingPercentage(
    projectId: number, 
    excludeTaskId?: number, 
    excludeMilestoneId?: number
  ): Promise<{
    totalFromTasks: number;
    totalFromMilestones: number;
    grandTotal: number;
    remainingPercentage: number;
  }> {
    // Get all billable tasks for the project
    const tasks = await storage.tasks.getTasksForProject(projectId);
    const billableTasks = tasks.filter(task => 
      task.isBillable && 
      task.id !== excludeTaskId && 
      task.billingType === 'percentage'
    );

    // Calculate total from tasks
    const totalFromTasks = billableTasks.reduce((sum, task) => {
      const percentage = parseFloat(task.billingPercentage?.toString() || '0');
      return sum + percentage;
    }, 0);

    // Get all billable milestones for the project
    const milestones = await storage.milestones.getMilestonesByProjectId(projectId);
    const billableMilestones = milestones.filter((milestone: any) => 
      milestone.isBillable && 
      milestone.id !== excludeMilestoneId
    );

    // Calculate total from milestones
    const totalFromMilestones = billableMilestones.reduce((sum: number, milestone: any) => {
      const percentage = parseFloat(milestone.billingPercentage?.toString() || '0');
      return sum + percentage;
    }, 0);

    const grandTotal = totalFromTasks + totalFromMilestones;
    const remainingPercentage = Math.max(0, 100 - grandTotal);

    return {
      totalFromTasks,
      totalFromMilestones,
      grandTotal,
      remainingPercentage
    };
  }

  /**
   * Validate task billing percentage against project total
   */
  static async validateTaskBillingPercentage(
    projectId: number, 
    billingPercentage: number, 
    excludeTaskId?: number
  ): Promise<{
    isValid: boolean;
    errorMessage?: string;
    currentTotal: number;
    remainingPercentage: number;
  }> {
    if (billingPercentage <= 0) {
      return { isValid: true, currentTotal: 0, remainingPercentage: 100 };
    }

    const billingTotals = await this.calculateTotalBillingPercentage(projectId, excludeTaskId);
    const proposedTotal = billingTotals.grandTotal + billingPercentage;

    if (proposedTotal > 100) {
      return {
        isValid: false,
        errorMessage: `Total billing percentage would exceed 100%. Current total: ${billingTotals.grandTotal.toFixed(2)}%. Available: ${billingTotals.remainingPercentage.toFixed(2)}%. Please reduce the percentage to ${billingTotals.remainingPercentage.toFixed(2)}% or less.`,
        currentTotal: billingTotals.grandTotal,
        remainingPercentage: billingTotals.remainingPercentage
      };
    }

    return {
      isValid: true,
      currentTotal: billingTotals.grandTotal,
      remainingPercentage: billingTotals.remainingPercentage
    };
  }

  /**
   * Validate milestone billing percentage against project total
   */
  static async validateMilestoneBillingPercentage(
    projectId: number, 
    billingPercentage: number, 
    excludeMilestoneId?: number
  ): Promise<{
    isValid: boolean;
    errorMessage?: string;
    currentTotal: number;
    remainingPercentage: number;
  }> {
    if (billingPercentage <= 0) {
      return { isValid: true, currentTotal: 0, remainingPercentage: 100 };
    }

    const billingTotals = await this.calculateTotalBillingPercentage(projectId, undefined, excludeMilestoneId);
    const proposedTotal = billingTotals.grandTotal + billingPercentage;

    if (proposedTotal > 100) {
      return {
        isValid: false,
        errorMessage: `Total billing percentage would exceed 100%. Current total: ${billingTotals.grandTotal.toFixed(2)}%. Available: ${billingTotals.remainingPercentage.toFixed(2)}%. Please reduce the percentage to ${billingTotals.remainingPercentage.toFixed(2)}% or less.`,
        currentTotal: billingTotals.grandTotal,
        remainingPercentage: billingTotals.remainingPercentage
      };
    }

    return {
      isValid: true,
      currentTotal: billingTotals.grandTotal,
      remainingPercentage: billingTotals.remainingPercentage
    };
  }

  /**
   * Throw an HttpError if billing validation fails
   */
  static async validateAndThrowForTask(
    projectId: number, 
    billingPercentage: number, 
    excludeTaskId?: number
  ): Promise<void> {
    if (!billingPercentage || billingPercentage <= 0) return;

    const validation = await this.validateTaskBillingPercentage(projectId, billingPercentage, excludeTaskId);
    if (!validation.isValid) {
      throw new HttpError(400, validation.errorMessage!);
    }
  }

  /**
   * Throw an HttpError if milestone billing validation fails
   */
  static async validateAndThrowForMilestone(
    projectId: number, 
    billingPercentage: number, 
    excludeMilestoneId?: number
  ): Promise<void> {
    if (!billingPercentage || billingPercentage <= 0) return;

    const validation = await this.validateMilestoneBillingPercentage(projectId, billingPercentage, excludeMilestoneId);
    if (!validation.isValid) {
      throw new HttpError(400, validation.errorMessage!);
    }
  }
}