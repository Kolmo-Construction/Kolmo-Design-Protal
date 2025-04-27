import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PunchListItem, User, DailyLogPhoto } from "@shared/schema"; // Import relevant types from schema
import { getQueryFn, apiRequest } from "@/lib/queryClient"; // Import query helpers
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, ListChecks, AlertTriangle, Image as ImageIcon, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate, cn } from "@/lib/utils";

// Import Dialogs
// import { CreatePunchListItemDialog } from "./CreatePunchListItemDialog";
// import { EditPunchListItemDialog } from "./EditPunchListItemDialog";
import { PhotoViewerDialog } from './PhotoViewerDialog'; // Import PhotoViewerDialog

// Combined type for API response including creator/assignee details
type PunchListItemWithDetails = PunchListItem & {
    creator?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
    assignee?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
};

interface ProjectPunchListTabProps {
  projectId: number;
}

// Helper Function for Status Badge
const getPunchStatusBadgeClasses = (status: string | null | undefined): string => {
    switch (status) {
        case 'open': return "bg-red-100 text-red-800 border-red-300";
        case 'in_progress': return "bg-yellow-100 text-yellow-800 border-yellow-300";
        case 'resolved': return "bg-blue-100 text-blue-800 border-blue-300";
        case 'verified': return "bg-green-100 text-green-800 border-green-300";
        default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
};
const getPunchStatusLabel = (status: string | null | undefined): string => {
    switch (status) {
        case 'open': return "Open";
        case 'in_progress': return "In Progress";
        case 'resolved': return "Resolved";
        case 'verified': return "Verified";
        default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
    }
};

export function ProjectPunchListTab({ projectId }: ProjectPunchListTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null); // State for delete confirmation
  const [viewingPhotosState, setViewingPhotosState] = useState<{ photos: DailyLogPhoto[]; startIndex: number } | null>(null); // State for photo viewer

  // TODO: Add state for editing item
  // const [editingItem, setEditingItem] = useState<PunchListItemWithDetails | null>(null);

  // Fetch punch list items for the project
  const punchListQueryKey = [`/api/projects/${projectId}/punch-list`];
  const {
    data: punchListItems = [],
    isLoading,
    error,
    isError,
  } = useQuery<PunchListItemWithDetails[]>({
    queryKey: punchListQueryKey,
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: projectId > 0,
  });

  // --- Mutation for Deleting Punch List Item ---
  const deletePunchListItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
        return await apiRequest('DELETE', `/api/projects/${projectId}/punch-list/${itemId}`);
    },
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: punchListQueryKey });
      toast({
        title: "Item Deleted",
        description: `Punch list item #${itemId} has been successfully deleted.`,
      });
      setItemToDelete(null);
    },
    onError: (error: Error, itemId) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete item #${itemId}: ${error.message}`,
        variant: "destructive",
      });
      setItemToDelete(null);
    },
  });

  // --- Handlers ---
  const handleAddItem = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditItem = (item: PunchListItemWithDetails) => {
    // setEditingItem(item);
    // setIsEditDialogOpen(true); // Need an Edit Dialog
    toast({ title: "Edit Item", description: `Edit functionality for item #${item.id} needs implementation.` });
  };

  const handleDeleteItem = (itemId: number) => {
     setItemToDelete(itemId);
  };

  // Updated handler: Sets state to trigger the PhotoViewerDialog
  const handleViewPhoto = (item: PunchListItemWithDetails) => {
      if (!item.photoUrl) {
           toast({ title: "No Photo", description: "This item does not have an associated photo.", variant: "destructive" });
           return;
       }
       // Adapt the single photo URL to the DailyLogPhoto[] structure expected by the dialog
       const photoToShow: DailyLogPhoto = {
           id: item.id, // Use item id as placeholder, viewer doesn't seem to use it
           dailyLogId: -1, // Not applicable here
           photoUrl: item.photoUrl,
           caption: `Photo for Punch List Item #${item.id}: ${item.description?.substring(0, 50) || ''}...`, // Optional caption
           createdAt: item.createdAt ?? new Date(), // Use item creation date or now
           uploadedById: item.createdById || 1 // Fallback to user 1 if not available
       };
       setViewingPhotosState({ photos: [photoToShow], startIndex: 0 });
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (isError || error) {
      return (
         <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Punch List</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "An unknown error occurred."}
            </AlertDescription>
          </Alert>
      );
    }

     if (punchListItems.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg mt-4">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <ListChecks className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Punch List is Clear</h3>
                <p className="text-muted-foreground mb-4">No outstanding items found for this project.</p>
                 <Button size="sm" onClick={handleAddItem} className="gap-1">
                   <PlusCircle className="h-4 w-4" />
                   Add Punch List Item
                </Button>
            </div>
        );
    }

    // --- Render Table of Items ---
    return (
      <div className="overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {punchListItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium align-top">{item.description}</TableCell>
                <TableCell className="align-top">{item.location || '-'}</TableCell>
                <TableCell className="align-top">
                  {item.assignee ? `${item.assignee.firstName} ${item.assignee.lastName}` : 'Unassigned'}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline" className={getPunchStatusBadgeClasses(item.status)}>
                    {getPunchStatusLabel(item.status)}
                  </Badge>
                </TableCell>
                <TableCell className="align-top">{item.dueDate ? formatDate(item.dueDate, "P") : '-'}</TableCell>
                <TableCell className="text-right align-top">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {item.photoUrl && (
                                <DropdownMenuItem onClick={() => handleViewPhoto(item)}> {/* Pass the whole item */}
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    View Photo
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Item
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
     <> {/* Use Fragment to hold Card and Dialogs */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <div>
             <CardTitle>Punch List</CardTitle>
             <CardDescription>Track remaining items needing attention before project completion.</CardDescription>
           </div>
           <Button size="sm" onClick={handleAddItem} className="gap-1">
             <PlusCircle className="h-4 w-4" />
             Add Item
          </Button>
         </CardHeader>
         <CardContent>
           {/* TODO: Add filtering/sorting controls here later */}
           {renderContent()}
         </CardContent>
       </Card>

       {/* --- Confirmation Dialog for Delete --- */}
       <AlertDialog
            open={itemToDelete !== null}
            onOpenChange={(isOpen) => { if (!isOpen) { setItemToDelete(null); }}}
        >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete punch list item #{itemToDelete} and any associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePunchListItemMutation.isPending}>
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => { if (itemToDelete) { deletePunchListItemMutation.mutate(itemToDelete); }}}
                disabled={!itemToDelete || deletePunchListItemMutation.isPending}
            >
              {deletePunchListItemMutation.isPending && ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> )}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* --- Photo Viewer Dialog Instance --- */}
       <PhotoViewerDialog
            isOpen={!!viewingPhotosState}
            setIsOpen={() => setViewingPhotosState(null)}
            photos={viewingPhotosState?.photos ?? []}
            startIndex={viewingPhotosState?.startIndex ?? 0}
        />

      {/* --- TODO: Add CreatePunchListItemDialog Component --- */}
      {/* <CreatePunchListItemDialog ... /> */}

      {/* --- TODO: Add EditPunchListItemDialog Component --- */}
      {/* <EditPunchListItemDialog ... /> */}

     </>
  );
}

// Helper function to get button variants (copied from previous version)
import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}