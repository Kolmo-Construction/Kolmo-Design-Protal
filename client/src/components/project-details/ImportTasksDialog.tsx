// client/src/components/project-details/ImportTasksDialog.tsx
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Check, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Task } from 'gantt-task-react';

// Define prop types for the component
interface ImportTasksDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  projectId: number;
  onImport: (tasks: Task[]) => void;
  isPending: boolean;
}

export function ImportTasksDialog({ 
  isOpen, 
  setIsOpen, 
  projectId, 
  onImport,
  isPending 
}: ImportTasksDialogProps) {
  // State for JSON content
  const [jsonContent, setJsonContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    taskCount: number;
  } | null>(null);

  // Clear states when dialog is opened or closed
  React.useEffect(() => {
    if (!isOpen) {
      // Reset when dialog closes
      setJsonContent('');
      setError(null);
      setValidationResult(null);
    }
  }, [isOpen]);

  // Function to validate JSON structure against expected Task format
  const validateJson = (jsonText: string): boolean => {
    try {
      // Parse JSON
      const parsedJson = JSON.parse(jsonText);
      
      // Check if we have an array
      if (!Array.isArray(parsedJson)) {
        setError("JSON must contain an array of tasks");
        return false;
      }
      
      // Empty array is valid but not useful
      if (parsedJson.length === 0) {
        setError("JSON array is empty. No tasks to import.");
        return false;
      }
      
      // Validate each task has required properties
      const invalidTasks = parsedJson.filter(task => {
        return (
          typeof task.id !== 'string' ||
          !task.name ||
          !task.start ||
          !task.end ||
          !['task', 'milestone', 'project'].includes(task.type) ||
          typeof task.progress !== 'number' ||
          task.progress < 0 ||
          task.progress > 100
        );
      });
      
      if (invalidTasks.length > 0) {
        setError(`${invalidTasks.length} tasks do not match the required format. Each task must have id, name, start, end, type, and progress properties.`);
        return false;
      }
      
      // If we're here, the JSON is valid
      setValidationResult({
        isValid: true,
        message: "JSON is valid",
        taskCount: parsedJson.length,
      });
      
      return true;
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Invalid JSON format";
      setError(errorMessage);
      return false;
    }
  };

  // Handle validating the JSON
  const handleValidateClick = () => {
    setError(null);
    setValidationResult(null);
    
    if (!jsonContent.trim()) {
      setError("Please enter JSON content");
      return;
    }
    
    validateJson(jsonContent);
  };

  // Handle importing the tasks
  const handleImportClick = () => {
    setError(null);
    
    if (!jsonContent.trim()) {
      setError("Please enter JSON content");
      return;
    }
    
    if (validateJson(jsonContent)) {
      try {
        const tasks = JSON.parse(jsonContent) as Task[];
        onImport(tasks);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to import tasks";
        setError(errorMessage);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Tasks from JSON</DialogTitle>
          <DialogDescription>
            Paste your task JSON data below. Tasks must follow the gantt-task-react structure.
          </DialogDescription>
        </DialogHeader>
        
        {/* Sample JSON Format Guide */}
        <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-32">
          <p className="mb-1 text-muted-foreground text-sm">Expected format:</p>
          <pre>{`[
  {
    "id": "task1",
    "name": "Task Name",
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2025-01-10T00:00:00.000Z",
    "type": "task", // or "milestone" or "project"
    "progress": 0,
    "dependencies": "task2,task3" // optional
  },
  // ... more tasks
]`}</pre>
        </div>
        
        {/* JSON Input Area */}
        <Textarea
          placeholder="Paste your JSON here..."
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Validation Success */}
        {validationResult?.isValid && (
          <Alert className="bg-green-50 border-green-300 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Valid JSON</AlertTitle>
            <AlertDescription>
              Ready to import {validationResult.taskCount} tasks.
            </AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="flex space-x-2 justify-between sm:justify-end">
          <Button 
            variant="outline" 
            onClick={handleValidateClick}
            disabled={!jsonContent.trim() || isPending}
          >
            Validate JSON
          </Button>
          
          <div className="space-x-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            
            <Button
              type="submit"
              onClick={handleImportClick}
              disabled={!jsonContent.trim() || isPending || validationResult === null || validationResult.isValid === false}
              className="gap-1"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} 
              {isPending ? "Importing..." : "Import Tasks"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}