// client/src/components/project-details/ClientFriendlyTimeline.tsx
import React, { useMemo } from 'react';
import { format, isAfter, isBefore, isToday, addDays, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Milestone, CheckCircle2, Clock, Calendar, ArrowRight, CheckCheck, AlertTriangle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { Task as ApiTask } from '@shared/schema';

interface ClientFriendlyTimelineProps {
  tasks: ApiTask[];
  projectStartDate?: Date | null;
  projectEndDate?: Date | null;
}

// Calculate the percentage of time passed in a date range
function getCompletionPercentage(startDate: Date, endDate: Date): number {
  const today = new Date();
  
  // If today is before start date, return 0%
  if (isBefore(today, startDate)) return 0;
  
  // If today is after end date, return 100%
  if (isAfter(today, endDate)) return 100;
  
  // Calculate percentage
  const totalDays = differenceInDays(endDate, startDate) || 1; // Avoid division by zero
  const daysPassed = differenceInDays(today, startDate);
  return Math.round((daysPassed / totalDays) * 100);
}

// Get the status color and icon for a task
function getTaskStatusInfo(task: ApiTask, now = new Date()) {
  const startDate = task.startDate ? new Date(task.startDate) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  
  if (task.status === 'done') {
    return { 
      color: 'bg-green-100 text-green-800 border-green-300', 
      icon: <CheckCheck className="h-4 w-4 mr-1" />,
      label: 'Completed'
    };
  }
  
  if (task.status === 'in_progress') {
    return { 
      color: 'bg-blue-100 text-blue-800 border-blue-300', 
      icon: <Clock className="h-4 w-4 mr-1" />,
      label: 'In Progress'
    };
  }
  
  if (task.status === 'blocked') {
    return { 
      color: 'bg-red-100 text-red-800 border-red-300', 
      icon: <AlertTriangle className="h-4 w-4 mr-1" />,
      label: 'Blocked'
    };
  }
  
  // If has dates but not started yet
  if (startDate && isAfter(startDate, now)) {
    return { 
      color: 'bg-purple-100 text-purple-800 border-purple-300', 
      icon: <Calendar className="h-4 w-4 mr-1" />,
      label: 'Upcoming'
    };
  }
  
  // Default status (todo)
  return { 
    color: 'bg-gray-100 text-gray-700 border-gray-300', 
    icon: <CircleDot className="h-4 w-4 mr-1" />,
    label: 'Planned' 
  };
}

export function ClientFriendlyTimeline({ 
  tasks, 
  projectStartDate, 
  projectEndDate 
}: ClientFriendlyTimelineProps) {
  // Sort tasks by start date (if available)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by start date if available
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      
      // If only one has start date, prioritize it
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      
      // Sort by ID as fallback
      return a.id - b.id;
    });
  }, [tasks]);
  
  // Calculate project timeline info
  const timelineInfo = useMemo(() => {
    // Find first and last task dates if project dates are not provided
    let firstDate = projectStartDate;
    let lastDate = projectEndDate;
    
    if (!firstDate || !lastDate) {
      sortedTasks.forEach(task => {
        if (task.startDate) {
          const taskStartDate = new Date(task.startDate);
          if (!firstDate || isBefore(taskStartDate, firstDate)) {
            firstDate = taskStartDate;
          }
        }
        
        if (task.dueDate) {
          const taskDueDate = new Date(task.dueDate);
          if (!lastDate || isAfter(taskDueDate, lastDate)) {
            lastDate = taskDueDate;
          }
        }
      });
    }
    
    // Default dates if still not available
    const today = new Date();
    firstDate = firstDate || today;
    lastDate = lastDate || addDays(today, 30);
    
    // Calculate time progress percentage
    const timeProgress = getCompletionPercentage(firstDate, lastDate);
    
    // Format dates
    const formattedStartDate = format(firstDate, 'MMMM d, yyyy');
    const formattedEndDate = format(lastDate, 'MMMM d, yyyy');
    
    // Calculate project duration
    const durationInDays = differenceInDays(lastDate, firstDate);
    
    return {
      firstDate,
      lastDate,
      formattedStartDate,
      formattedEndDate,
      timeProgress,
      durationInDays
    };
  }, [sortedTasks, projectStartDate, projectEndDate]);
  
  if (tasks.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center border rounded-lg bg-gray-50">
        <Milestone className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No Schedule Available Yet</h3>
        <p className="text-muted-foreground mb-2 text-center max-w-md">
          The project timeline is still being developed. Check back soon for updates on your project schedule.
        </p>
      </div>
    );
  }
  
  // Count tasks by status
  const statusCounts = sortedTasks.reduce((counts, task) => {
    const status = task.status || 'todo';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Count completed tasks
  const completedTasks = statusCounts['done'] || 0;
  const totalTasks = sortedTasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
  
  return (
    <div className="w-full">
      {/* Project Timeline Overview */}
      <div className="mb-8 p-6 border rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 shadow-sm">
        <h3 className="text-xl font-semibold mb-2 text-slate-800">
          Project Timeline Overview
        </h3>
        
        <div className="mb-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <Calendar className="h-4 w-4 mr-2 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Project Duration:</span>
            </div>
            <p className="text-lg font-medium">
              {timelineInfo.durationInDays} days
            </p>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <Clock className="h-4 w-4 mr-2 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Project Timeframe:</span>
            </div>
            <p className="text-base">
              {timelineInfo.formattedStartDate} <ArrowRight className="inline-block h-3 w-3 mx-1" /> {timelineInfo.formattedEndDate}
            </p>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">Progress:</span>
              </div>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{completedTasks} tasks completed</span>
              <span>{totalTasks} total tasks</span>
            </div>
          </div>
        </div>
        
        <div className="relative pt-4">
          <div className="flex justify-between mb-2">
            <div className="text-sm text-slate-600">Project Start</div>
            <div className="text-sm text-slate-600">Timeline Progress</div>
            <div className="text-sm text-slate-600">Project End</div>
          </div>
          
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" 
              style={{ width: `${timelineInfo.timeProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <div>{timelineInfo.formattedStartDate}</div>
            <div>{timelineInfo.formattedEndDate}</div>
          </div>
          
          {/* Today marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500" 
            style={{ 
              left: `${Math.min(Math.max(timelineInfo.timeProgress, 0), 100)}%`,
              height: '24px', 
              top: '24px' 
            }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500 absolute -left-1 -top-1.5" />
            <div className="absolute -left-8 -top-6 text-xs font-medium bg-red-100 text-red-800 px-1.5 py-0.5 rounded whitespace-nowrap">
              Today
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Timeline */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Task Timeline
        </h3>
        
        <div className="space-y-4">
          {sortedTasks.map((task, index) => {
            const { color, icon, label } = getTaskStatusInfo(task);
            const startDate = task.startDate ? new Date(task.startDate) : null;
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            
            const timeframe = startDate && dueDate 
              ? `${format(startDate, 'MMM d')} - ${format(dueDate, 'MMM d, yyyy')}`
              : startDate 
                ? `Starts ${format(startDate, 'MMM d, yyyy')}`
                : dueDate 
                  ? `Due by ${format(dueDate, 'MMM d, yyyy')}`
                  : 'No date specified';
                  
            const isCurrentTask = startDate && dueDate 
              ? isAfter(new Date(), startDate) && isBefore(new Date(), dueDate)
              : false;
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "border rounded-lg p-4 relative overflow-hidden",
                  isCurrentTask ? "border-blue-300 shadow-md" : "border-gray-200"
                )}
              >
                {/* Status indicator bar */}
                <div className={cn("absolute top-0 left-0 w-1 h-full", color.split(' ')[0])} />
                
                <div className="flex flex-col md:flex-row gap-2 justify-between">
                  <div className="flex-grow">
                    <h4 className="text-lg font-medium mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-slate-600 mb-3 text-sm">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className={cn("flex items-center", color)}>
                        {icon} {label}
                      </Badge>
                      
                      <span className="text-sm text-slate-500 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 inline" />
                        {timeframe}
                      </span>
                      
                      {isCurrentTask && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" /> Current Task
                        </Badge>
                      )}
                      
                      {isToday(dueDate || new Date()) && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                          Due Today
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Task progress indicator for in-progress tasks */}
                  {task.status === 'in_progress' && startDate && dueDate && (
                    <div className="w-full md:w-48 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-slate-600">Progress</span>
                        <span className="text-xs font-medium">
                          {getCompletionPercentage(startDate, dueDate)}%
                        </span>
                      </div>
                      <Progress 
                        value={getCompletionPercentage(startDate, dueDate)} 
                        className="h-2" 
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}