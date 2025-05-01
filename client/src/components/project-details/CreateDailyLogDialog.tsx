import React, { useState, useRef, useEffect } from 'react'; // Added useEffect
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Import schema and types
import { InsertDailyLog, insertDailyLogSchema } from "@shared/schema"; // Keep original schema import
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import mutation hooks (assuming apiRequest is not used here due to FormData)
// import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, PlusCircle, UploadCloud, X, ImageIcon } from "lucide-react"; // Import icons
import { cn, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast"; // Import toast
import { z } from "zod"; // Import z

// --- MODIFICATION START ---
// Define a schema specifically for the frontend form validation
// Omit fields that are set by the backend or derived from context
const frontendDailyLogSchema = insertDailyLogSchema.omit({
  createdById: true, // Backend sets this based on logged-in user
  projectId: true    // This comes from component props, not form input
});

// Define the type for the form values based on the new frontend schema
// Explicitly include logPhotos which is handled separately
type FrontendDailyLogFormValues = z.infer<typeof frontendDailyLogSchema> & {
    logPhotos?: FileList | null; // For handling file input
};
// --- MODIFICATION END ---

interface CreateDailyLogDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  projectId: number;
  onSuccess?: () => void; // Optional callback on success
}

export function CreateDailyLogDialog({
  isOpen,
  setIsOpen,
  projectId,
  onSuccess
}: CreateDailyLogDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for clearing file input

  // --- MODIFICATION START ---
  // Setup react-hook-form with Zod validation using the frontend-specific schema
  const form = useForm<FrontendDailyLogFormValues>({ // Use new type
    resolver: zodResolver(frontendDailyLogSchema), // Use new frontend schema
    defaultValues: {
      // Remove projectId and createdById from defaults
      logDate: new Date(), // Default to today
      weather: "",
      temperature: undefined,
      crewOnSite: "",
      workPerformed: "",
      issuesEncountered: "",
      safetyObservations: "",
      logPhotos: null, // Reset file input state
    },
  });
  // --- MODIFICATION END ---

  // Reset form when dialog opens or projectId changes
  // Use useEffect for side effects like resetting form state
  useEffect(() => {
    if (isOpen) {
      form.reset({
        // Reset using default values matching the frontend schema
        logDate: new Date(),
        weather: "",
        temperature: undefined,
        crewOnSite: "",
        workPerformed: "",
        issuesEncountered: "",
        safetyObservations: "",
        logPhotos: null,
      });
      setSelectedFiles([]); // Clear selected files preview
      if (fileInputRef.current) {
         fileInputRef.current.value = ""; // Attempt to clear file input visually
      }
    }
  }, [isOpen, form]); // Dependency array includes form instance and isOpen state

  // Mutation hook for creating a daily log (using FormData)
  const createDailyLogMutation = useMutation({
    // Pass the correct type for formValues based on the frontend schema
    mutationFn: async (data: { formValues: FrontendDailyLogFormValues, files: File[] }) => {
      console.log("Starting fetch request to create daily log");

      try {
        const { formValues, files } = data;
        console.log("Form values (frontend schema):", formValues);
        console.log("Files:", files.map(f => f.name));

        // Create FormData
        const formData = new FormData();

        // Explicitly include the project ID from component props
        formData.append('projectId', projectId.toString());

        // Append text fields from formValues (matching frontendDailyLogSchema)
        formData.append('logDate', new Date(formValues.logDate!).toISOString());
        if (formValues.weather) formData.append('weather', formValues.weather);
        // Ensure temperature is checked for null explicitly before toString()
        if (formValues.temperature !== undefined && formValues.temperature !== null) {
          formData.append('temperature', formValues.temperature.toString());
        }
        if (formValues.crewOnSite) formData.append('crewOnSite', formValues.crewOnSite);
        formData.append('workPerformed', formValues.workPerformed); // Required by schema
        if (formValues.issuesEncountered) formData.append('issuesEncountered', formValues.issuesEncountered);
        if (formValues.safetyObservations) formData.append('safetyObservations', formValues.safetyObservations);

        // Append files
        files.forEach(file => {
          formData.append('photos', file, file.name); // Backend expects 'photos'
        });

        // projectId comes from component props, not formValues
        const url = `/api/projects/${projectId}/daily-logs`;
        console.log(`Submitting to URL: ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          credentials: 'include', // Include cookies for authentication
        });
        console.log(`Response status: ${response.status}`);

        // Get response text regardless of status to see what's returned
        const responseText = await response.text();
        console.log(`Response text: ${responseText}`);

        // If not OK, throw an error with the response
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { message: responseText || response.statusText };
          }
          throw new Error(errorData.message || `Failed to create log: ${response.status}`);
        }

        // If OK, parse response as JSON
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          responseData = { message: "Success but could not parse response" };
        }

        return responseData;
      } catch (error) {
        console.error("Caught error in mutation:", error);
        // Rethrow to allow onError handler to catch it
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Create daily log success:", data);
      toast({ title: "Success", description: "Daily log submitted successfully." });
      // Invalidate the daily logs query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/daily-logs`] });
      setIsOpen(false); // Close dialog on success
      onSuccess?.(); // Call optional success callback
    },
    onError: (err) => {
      console.error("Error creating daily log:", err);
      toast({
        title: "Error Submitting Log",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection changes
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Convert FileList to Array and add to existing selections
      const newFiles = Array.from(event.target.files);
      // You might want to add checks for file size, type, and total number of files here
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 files example
      // Clear the input value so the same file can be selected again if removed
      if (event.target) {
          event.target.value = '';
      }
    }
  };

  // Remove a selected file from the preview
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // Clearing the ref's value doesn't reliably remove specific files from the
    // underlying input's FileList, but handleFileChange now clears it after selection.
  };

  // --- MODIFICATION START ---
  // Handle form submission - Accepts values matching the frontend schema
  const handleFormSubmit = (values: FrontendDailyLogFormValues) => {
    // console.log("--- handleFormSubmit triggered ---"); // Keep or remove as needed
    console.log("Form values submitted (frontend schema):", values);
    console.log("Selected files:", selectedFiles.map(f => f.name));

    // Trigger the mutation with form values matching FrontendDailyLogFormValues
    // and the separate files state
    createDailyLogMutation.mutate({
      formValues: values,
      files: selectedFiles
    });
  };
  // --- MODIFICATION END ---

  // Log render state for debugging button disabled state
  console.log("CreateDailyLogDialog rendering, isPending:", createDailyLogMutation.isPending);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]"> {/* Wider dialog */}
        <DialogHeader>
          <DialogTitle>Create New Daily Log</DialogTitle>
          <DialogDescription>
            Submit a daily report for this project. Include details and photos.
          </DialogDescription>
        </DialogHeader>

        {/* Form implementation */}
        <Form {...form}>
           {/* --- MODIFICATION: Removed explicit validation error logger --- */}
           {/* It served its purpose, but react-hook-form typically shows errors */}
           <form
              onSubmit={form.handleSubmit(handleFormSubmit)} // Pass the success callback only
              className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3"
            >

            {/* Log Date */}
            <FormField
              control={form.control}
              name="logDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Log Date*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal h-10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? formatDate(field.value, "PPP") // Use imported formatDate
                            : <span>Pick a date</span>
                          }
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date)} // RHF handles Date object
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")} // Optional: disable future/past dates
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

             {/* Weather and Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weather"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weather</FormLabel>
                      <FormControl>
                        {/* Use value={field.value ?? ''} to handle null/undefined */}
                        <Input placeholder="e.g., Sunny, Cloudy, Rain" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any" // Allow decimals
                          placeholder="e.g., 72.5"
                          {...field}
                          // Ensure value is controlled and handles undefined/null by showing empty string
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Pass undefined if empty, otherwise parse as float
                            field.onChange(value === '' ? undefined : parseFloat(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>

            {/* Crew On Site */}
            <FormField
              control={form.control}
              name="crewOnSite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crew On Site</FormLabel>
                  <FormControl>
                    <Input placeholder="List crew members or trades present" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Performed */}
            <FormField
              control={form.control}
              name="workPerformed" // This is required by the schema
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Performed*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work completed today..."
                      className="min-h-[100px]"
                      {...field} // No need for value={field.value ?? ''} as it's required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Issues Encountered */}
            <FormField
              control={form.control}
              name="issuesEncountered"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issues Encountered</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any issues, delays, or blockers (optional)"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Safety Observations */}
            <FormField
              control={form.control}
              name="safetyObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safety Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note any safety concerns or positive observations (optional)"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormItem>
                <FormLabel>Attach Photos (Optional, up to 5)</FormLabel>
                <FormControl>
                    <div className="flex items-center gap-2">
                        {/* Use a button styled as the input trigger */}
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="relative">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Select Files
                        </Button>
                         {/* Hidden actual file input */}
                        <Input
                            ref={fileInputRef} // Assign ref
                            id="logPhotos"
                            type="file"
                            multiple // Allow multiple files
                            accept="image/*" // Accept only images
                            onChange={handleFileChange}
                            className="absolute w-0 h-0 opacity-0" // Visually hide the input
                         />
                         <span className="text-xs text-muted-foreground">
                           {selectedFiles.length} file(s) selected
                        </span>
                    </div>
                </FormControl>
                 {/* File Preview */}
                 {selectedFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="relative group w-20 h-20 border rounded p-1 flex flex-col items-center justify-center">
                                 <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                                <p className="text-xs text-center truncate w-full" title={file.name}>{file.name}</p>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    aria-label="Remove file"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                         ))}
                    </div>
                 )}
                <FormDescription>Attach relevant photos for this log entry.</FormDescription>
                {/* FormMessage could be used here if you implement file-specific validation */}
                <FormMessage />
             </FormItem>

            {/* Form Buttons */}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDailyLogMutation.isPending}>
                {createDailyLogMutation.isPending ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Submitting...
                   </>
                 ) : (
                   "Submit Daily Log"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}