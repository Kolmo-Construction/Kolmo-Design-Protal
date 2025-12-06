import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { DailyLogPhoto } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PhotoViewerDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  photos: DailyLogPhoto[] | null | undefined;
  startIndex?: number;
  onDelete?: (deletedPhoto: DailyLogPhoto) => void; // Callback when a photo is deleted
}

export function PhotoViewerDialog({
  isOpen,
  setIsOpen,
  photos = [],
  startIndex = 0,
  onDelete,
}: PhotoViewerDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Effect to set the starting index when the dialog opens or photos/startIndex change
  useEffect(() => {
    if (isOpen && photos && photos.length > 0) {
      const validStartIndex = Math.max(0, Math.min(startIndex, photos.length - 1));
      setCurrentIndex(validStartIndex);
    }
  }, [isOpen, photos, startIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
  }, []);

  const goToNext = useCallback(() => {
    if (photos && photos.length > 0) {
      setCurrentIndex((prevIndex) =>
        prevIndex < photos.length - 1 ? prevIndex + 1 : prevIndex
      );
    }
  }, [photos]);

  const handleDelete = async () => {
    const currentPhoto = photos?.[currentIndex];
    if (!currentPhoto) return;

    // Check if the photo has a key or id to delete
    // Assuming DailyLogPhoto has a 'key' or 'id' property
    const photoKey = (currentPhoto as any).key || (currentPhoto as any).photoUrl?.split('/').pop();
    if (!photoKey) {
      toast({
        title: 'Error',
        description: 'Cannot delete photo: missing identifier',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest('DELETE', `/api/storage/delete/${encodeURIComponent(photoKey)}`, {});
      
      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });

      // Call the onDelete callback if provided
      onDelete?.(currentPhoto);

      // If there are more photos, adjust the current index
      if (photos && photos.length > 1) {
        // If we're at the last photo, move to the previous one
        if (currentIndex === photos.length - 1) {
          setCurrentIndex(currentIndex - 1);
        }
        // The photo will be removed from the parent component's state
      } else {
        // If no photos left, close the dialog
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, goToPrevious, goToNext, setIsOpen, currentIndex, photos]);

  const currentPhoto = photos?.[currentIndex];
  const totalPhotos = photos?.length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl p-0"> {/* Wider dialog, remove default padding */}
        <DialogHeader className="p-4 border-b">
          <DialogTitle>View Photos</DialogTitle>
           {/* Display caption if available */}
           {currentPhoto?.caption && (
               <DialogDescription>{currentPhoto.caption}</DialogDescription>
           )}
        </DialogHeader>

        {/* Main Content Area */}
        <div className="relative p-4 flex justify-center items-center min-h-[50vh] max-h-[75vh] bg-muted/30">
          {/* Previous Button */}
          {totalPhotos > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Image Display */}
          {currentPhoto ? (
            <div className="relative">
              <img
                src={currentPhoto.photoUrl}
                alt={currentPhoto.caption || `Photo ${currentIndex + 1} of ${totalPhotos}`}
                className="max-w-full max-h-[70vh] object-contain block"
              />
              {/* Delete Button Overlay */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-white"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete photo"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
                {photos && photos.length === 0 ? "No photos available." : "Loading photo..."}
            </div>
          )}

          {/* Next Button */}
          {totalPhotos > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground"
              onClick={goToNext}
              disabled={currentIndex === totalPhotos - 1}
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Footer with index and close button */}
        <DialogFooter className="p-3 border-t flex justify-between items-center">
           <div className="text-sm text-muted-foreground">
               {totalPhotos > 0 ? `Photo ${currentIndex + 1} of ${totalPhotos}` : "No photos"}
           </div>
           {/* Use DialogClose for better accessibility */}
           <DialogClose asChild>
              <Button type="button" variant="secondary">
                  Close
              </Button>
           </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
