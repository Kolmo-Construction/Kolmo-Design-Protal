import type { Task } from '@/types/wx-react-gantt'; // Assuming GanttTask type is imported or defined
import type { Task as ApiTask } from '../../server/storage/types'; // Assuming API Task type
import { differenceInDays, formatISO, parseISO, max, startOfDay, endOfDay, isValid } from 'date-fns';

// Define the structure expected by wx-react-gantt more explicitly if not imported
// This is a *guess* based on common Gantt properties and the error.
// You should verify this against the wx-react-gantt documentation.
interface GanttTask extends Task {
  id: string | number; // Must be unique
  name: string;
  start: Date; // Should be Date objects
  end: Date; // Should be Date objects
  progress: number; // Typically 0-100
  type: 'task' | 'milestone' | 'project'; // Crucial property based on the error!
  dependencies?: (string | number)[]; // Array of dependency task IDs
  // Add any other properties required by wx-react-gantt
  // project?: string | number;
  // displayOrder?: number;
    styles?: {
        backgroundColor?: string;
        progressColor?: string;
        progressSelectedColor?: string;
    };
    isDisabled?: boolean; // Example optional property
}

// Define the structure for dependencies/links if separate
interface GanttLink {
    id: string | number; // Unique ID for the link
    source: string | number; // Source task ID
    target: string | number; // Target task ID
    type: 0 | 1 | 2 | 3; // Link type (e.g., Finish-to-Start) - Check library docs!
}


// Assuming your API returns tasks somewhat like this:
// type ApiTask = {
//   id: number;
//   title: string;
//   description: string | null;
//   startDate: string | null; // ISO String?
//   dueDate: string | null;   // ISO String?
//   status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
//   priority: 'LOW' | 'MEDIUM' | 'HIGH';
//   projectId: number;
//   assigneeId: number | null;
//   parentId: number | null;
//   createdAt: string;
//   updatedAt: string;
//   // Potential field for dependencies? e.g., dependsOn: number[] | null;
// };


/**
 * Transforms API tasks into the format required by wx-react-gantt.
 * Filters out tasks that are missing valid start or due dates from the API.
 * @param apiTasks - Array of tasks fetched from the API.
 * @returns An object containing formatted tasks and links.
 */
export function formatTasksForGantt(apiTasks: ApiTask[] | undefined | null): { tasks: GanttTask[], links: GanttLink[] } {
    // --- Input Validation ---
  if (!apiTasks || apiTasks.length === 0) {
    console.warn('[gantt-utils] No API tasks provided to format.');
    return { tasks: [], links: [] };
  }

    console.log('[gantt-utils] Input API Tasks:', JSON.parse(JSON.stringify(apiTasks))); // Deep copy for logging

    const formattedTasks: GanttTask[] = [];
    const taskMap = new Map<number, ApiTask>(); // For quick lookups if needed for dependencies
    const validTaskIds = new Set<string | number>(); // Keep track of tasks that are valid for Gantt

  apiTasks.forEach((apiTask) => {
        // --- Basic Sanity Check ---
        if (!apiTask || typeof apiTask.id === 'undefined') {
            console.warn('[gantt-utils] Skipping invalid API task object:', apiTask);
            return; // Skip this task if it's fundamentally broken
        }

        taskMap.set(apiTask.id, apiTask); // Populate map regardless of date validity for dependency checks

        // --- **Date Handling & Validation (Filtering Approach)** ---
        if (!apiTask.startDate || !apiTask.dueDate) {
             console.warn(`[gantt-utils] Task ID ${apiTask.id} ('${apiTask.title}') is missing original start or due date. Filtering out from Gantt view.`);
             return; // Skip task if original dates are missing
        }

        let startDate: Date | null = parseISO(apiTask.startDate);
        let endDate: Date | null = parseISO(apiTask.dueDate);

        // Validate parsed dates - skip if invalid
        if (!isValid(startDate)) {
             console.warn(`[gantt-utils] Task ID ${apiTask.id} ('${apiTask.title}') has invalid start date string: ${apiTask.startDate}. Filtering out.`);
             return; // Skip task
        }
         if (!isValid(endDate)) {
             console.warn(`[gantt-utils] Task ID ${apiTask.id} ('${apiTask.title}') has invalid end date string: ${apiTask.dueDate}. Filtering out.`);
             return; // Skip task
        }

        // --- Date Adjustment Logic (from logs) ---
        // Ensure end date is not before start date (only applies if both dates are valid)
        if (endDate < startDate) {
            console.warn(`[gantt-utils] Task ID ${apiTask.id} ('${apiTask.title}') has due date before start date, adjusting end date for Gantt.`);
            // Set end date to be the same as start date (or end of start day)
            endDate = endOfDay(startDate);
            // Alternative: Make it one day long: endDate = addDays(startOfDay(startDate), 1);
        }


        // --- Progress Calculation ---
        // (Same as before)
        let progress = 0;
        switch (apiTask.status) {
            case 'COMPLETED': progress = 100; break;
            case 'IN_PROGRESS': progress = 50; break; // Placeholder
            default: progress = 0; break;
        }

        // --- **CRUCIAL: Determine Task Type** ---
        // (Same as before - ensure this logic is correct)
        let taskType: GanttTask['type'] = 'task'; // Default to 'task'
        if (differenceInDays(endDate, startDate) === 0) {
             // taskType = 'milestone'; // Uncomment if this logic applies
        }
        // Add other logic based on apiTask fields if necessary


        // --- Construct the GanttTask Object ---
    const ganttTask: GanttTask = {
      id: String(apiTask.id), // Ensure ID is string if library expects it
      name: apiTask.title || `Task ${apiTask.id}`, // Provide default name
      start: startDate, // Use the validated & parsed Date object
      end: endDate,     // Use the validated & parsed Date object
      progress: progress,
            type: taskType,   // **Assign the determined type**
            isDisabled: apiTask.status === 'CANCELLED',
            styles: apiTask.status === 'CANCELLED' ? { backgroundColor: '#cccccc', progressColor: '#999999' } : undefined,
    };

        // --- Final Validation (Type Check) ---
        if (!ganttTask.type) {
             console.error(`[gantt-utils] CRITICAL: Task ID ${ganttTask.id} is missing 'type' property after formatting! Skipping task.`, ganttTask);
             return;
        }
        // Date validity already checked above

        validTaskIds.add(ganttTask.id); // Mark this task ID as valid for Gantt
    formattedTasks.push(ganttTask);
  });

    // --- Dependency / Link Handling ---
    // Now filter links to ensure both source and target tasks are included in the final Gantt list
    const formattedLinks: GanttLink[] = [];
    apiTasks.forEach(apiTask => {
        if (apiTask && apiTask.parentId !== null && typeof apiTask.parentId !== 'undefined') {
            const sourceId = String(apiTask.parentId);
            const targetId = String(apiTask.id);

            // Check if BOTH the source and target tasks made it into the formattedTasks list
            if (validTaskIds.has(sourceId) && validTaskIds.has(targetId)) {
                const link: GanttLink = {
                    id: `link-${sourceId}-to-${targetId}`,
                    source: sourceId,
                    target: targetId,
                    type: 0 // Assuming 0 is Finish-to-Start (Check library docs!)
                };
                formattedLinks.push(link);
            } else {
                 // Log if a potential link is skipped because one/both tasks were filtered out
                 if (!taskMap.has(apiTask.parentId)) {
                     console.warn(`[gantt-utils] Task ID ${targetId} has dependency on non-existent parent task ID ${sourceId}. Skipping link.`);
                 } else {
                     console.log(`[gantt-utils] Skipping link from ${sourceId} to ${targetId} because one or both tasks were filtered out due to missing/invalid dates.`);
                 }
            }
        }
        // Add more complex dependency logic here if needed
    });


    console.log('[gantt-utils] Output Formatted Tasks (after filtering):', JSON.parse(JSON.stringify(formattedTasks)));
    console.log('[gantt-utils] Output Formatted Links (after filtering):', JSON.parse(JSON.stringify(formattedLinks)));

  return { tasks: formattedTasks, links: formattedLinks };
}
