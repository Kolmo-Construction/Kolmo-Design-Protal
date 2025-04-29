// server/controllers/punchList.controller.ts
import { Request, Response } from 'express';
import { punchListRepository } from '../storage/repositories/punchList.repository';
import { PunchListRepository } from '../storage/repositories/punchList.repository'; // Import the class if needed for typing/injection
import { InsertPunchListItem, PunchListItem, punchListItems } from '@/shared/schema';
import { TypedRequestBody, TypedRequestParams, TypedRequest } from '@/server/types'; // Adjust import as necessary
import { AuthenticatedRequest } from '@/server/middleware/auth.middleware';
import { HttpError } from '../errors';
import { MediaRepository } from '../storage/repositories/media.repository'; // Assuming MediaRepository is in the same directory
import { logger } from '../utils/logger'; // Assuming a logger utility

// Initialize repositories (ensure these are correctly initialized with DB and other dependencies)
// If you have a dependency injection system, use that. Otherwise, ensure singletons are used.
// For demonstration, assuming they are initialized elsewhere or can be initialized here if safe.
// Example if not using a central factory:
// const punchListRepo = new PunchListRepository(/* db instance, media repo instance */);
// const mediaRepo = new MediaRepository(/* db instance, media storage instance, logger instance */);

// If using a central storage index:
import { storage } from '../storage'; // Assuming storage index exports instances


export class PunchListController {
    private punchListRepo: PunchListRepository;
    private mediaRepo: MediaRepository;

    constructor(punchListRepository: PunchListRepository = storage.punchListRepository, mediaRepository: MediaRepository = storage.mediaRepository) {
        this.punchListRepo = punchListRepository;
        this.mediaRepo = mediaRepository;
    }


    async getPunchListItemsForProject(req: TypedRequestParams<{ projectId: number }>, res: Response): Promise<void> {
        const projectId = Number(req.params.projectId);
        if (isNaN(projectId)) {
            res.status(400).json({ message: 'Invalid project ID' });
            return;
        }

        try {
            const punchListItems = await this.punchListRepo.getPunchListItems(projectId);
            res.json(punchListItems);
        } catch (error) {
            logger.error(`Error fetching punch list items for project ${projectId}:`, error);
            res.status(500).json({ message: 'Failed to fetch punch list items.' });
        }
    }

    async getPunchListItemById(req: TypedRequestParams<{ itemId: number }>, res: Response): Promise<void> {
        const itemId = Number(req.params.itemId);
        if (isNaN(itemId)) {
            res.status(400).json({ message: 'Invalid punch list item ID' });
            return;
        }

        try {
            const punchListItem = await this.punchListRepo.getPunchListItemById(itemId);
            if (!punchListItem) {
                res.status(404).json({ message: 'Punch list item not found.' });
                return;
            }
            res.json(punchListItem);
        } catch (error) {
            logger.error(`Error fetching punch list item ${itemId}:`, error);
            res.status(500).json({ message: 'Failed to fetch punch list item.' });
        }
    }


    async createPunchListItem(req: TypedRequestBody<InsertPunchListItem> & AuthenticatedRequest, res: Response): Promise<void> {
         // Note: Media upload for a *newly created* punch list item will likely happen in a separate request
         // after the item is created, returning its ID.
        const itemData = req.body;
        const userId = req.user.id; // Assuming user is authenticated and available

        try {
            const newPunchListItem = await this.punchListRepo.createPunchListItem({
                ...itemData,
                createdById: userId, // Assign the creating user
                 // Ensure no photoUrl is passed in itemData
                 // photoUrl: undefined // Explicitly unset if it might come from request somehow
            });

            if (!newPunchListItem) {
                 // This case might occur if createPunchListItem returns null (e.g., DB error before insert)
                logger.error('Failed to create punch list item, repository returned null.');
                res.status(500).json({ message: 'Failed to create punch list item.' });
                return;
            }


            // Fetch the created item with details to return a consistent structure
            const createdItemWithDetails = await this.punchListRepo.getPunchListItemById(newPunchListItem.id);

             if (!createdItemWithDetails) {
                 // This is an unexpected scenario if creation succeeded but fetching failed
                 logger.error(`Successfully created item ${newPunchListItem.id} but failed to fetch with details.`);
                  // Decide on appropriate response - perhaps return the basic item or 500 error
                 res.status(201).json(newPunchListItem); // Return basic item as fallback
                 return;
             }


            res.status(201).json(createdItemWithDetails); // Return the full item with details
        } catch (error: any) {
            logger.error('Error creating punch list item:', error);
             if (error instanceof HttpError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to create punch list item.' });
            }
        }
    }


    async updatePunchListItem(req: TypedRequest<{ itemId: number }, Partial<Omit<InsertPunchListItem, 'projectId' | 'createdById'>>> & AuthenticatedRequest, res: Response): Promise<void> {
        const itemId = Number(req.params.itemId);
         // Ensure projectId and createdById are not updated via this route
        const itemDataToUpdate = req.body; // This already omits projectId and createdById based on type

        if (isNaN(itemId)) {
            res.status(400).json({ message: 'Invalid punch list item ID' });
            return;
        }

         // Optional: Add authorization check here to ensure user can update this item

        try {
             // Ensure no photoUrl is passed in itemDataToUpdate
             // delete itemDataToUpdate.photoUrl; // Or handle upstream in validation/middleware

            const updatedPunchListItem = await this.punchListRepo.updatePunchListItem(itemId, itemDataToUpdate);

            if (!updatedPunchListItem) {
                res.status(404).json({ message: 'Punch list item not found.' });
                return;
            }

             // Fetch the updated item with details to return a consistent structure
             const updatedItemWithDetails = await this.punchListRepo.getPunchListItemById(itemId);

              if (!updatedItemWithDetails) {
                 // Unexpected scenario
                  logger.error(`Successfully updated item ${itemId} but failed to fetch with details.`);
                   res.status(200).json(updatedPunchListItem); // Return basic item as fallback
                   return;
              }

            res.status(200).json(updatedItemWithDetails); // Return the full item with details

        } catch (error) {
            logger.error(`Error updating punch list item ${itemId}:`, error);
            res.status(500).json({ message: 'Failed to update punch list item.' });
        }
    }


    async deletePunchListItem(req: TypedRequestParams<{ itemId: number }> & AuthenticatedRequest, res: Response): Promise<void> {
        const itemId = Number(req.params.itemId);
        if (isNaN(itemId)) {
            res.status(400).json({ message: 'Invalid punch list item ID' });
            return;
        }

        // Optional: Add authorization check here

        try {
             // The repository method now handles deleting associated media files and records
            await this.punchListRepo.deletePunchListItem(itemId);
            res.status(200).json({ message: 'Punch list item and associated media deleted successfully.' });
        } catch (error: any) {
            logger.error(`Error deleting punch list item ${itemId}:`, error);
             // If deleteMediaForPunchListItem in repo threw an error, it's caught here
            res.status(500).json({ message: `Failed to delete punch list item: ${error.message}` });
        }
    }

    // --- New Media Handling Methods ---

    async uploadPunchListItemMedia(req: TypedRequestParams<{ itemId: number }> & AuthenticatedRequest & { files: Express.Multer.File[] }, res: Response): Promise<void> {
         // This method assumes you are using Multer or similar middleware for file uploads
        const itemId = Number(req.params.itemId);
        const userId = req.user.id; // Uploader ID

        if (isNaN(itemId)) {
            res.status(400).json({ message: 'Invalid punch list item ID' });
            return;
        }

         if (!req.files || req.files.length === 0) {
             res.status(400).json({ message: 'No files uploaded.' });
             return;
         }

         // Optional: Verify the punch list item exists and the user has permissions

        const uploadedMedia = [];
        try {
            for (const file of req.files) {
                 // Assuming mediaStorage.uploadFile handles the upload to R2 and returns the URL
                 // The upload middleware might handle the R2 upload before this controller method
                 // If not, you'll need to call the mediaStorage.uploadFile here per file.

                 // For now, assuming file.path or similar contains the temporary path or the upload middleware
                 // has put the R2 URL onto the file object (less likely, but depends on middleware)
                 // Let's assume the upload middleware makes the file available in a usable format.
                 // A more robust approach would be to pass the file buffer and metadata to mediaStorage.uploadFile

                 // *** IMPORTANT ***: You need to adapt this part based on your actual file upload middleware
                 // and how it interacts with your MediaStorage.
                 // Example if your middleware prepares file.location (like Multer-S3):
                 // const mediaUrl = file.location;
                 // Example if you need to upload the buffer here:
                 // const mediaUrl = await this.mediaRepo.mediaStorage.uploadFile(file.originalname, file.buffer, file.mimetype);

                 // Let's assume the middleware handles the R2 upload and provides the public URL or key
                 // If the middleware provides a key, you'll need to construct the public URL here.
                 // Assuming a simple scenario where middleware provides file.path which is the URL after upload:
                 // ** This is a simplification, adjust based on your actual upload process **
                 const mediaUrl = (file as any).location || (file as any).path; // Adapt based on your middleware output

                 if (!mediaUrl) {
                     logger.error('Upload middleware did not provide media URL for file:', file.originalname);
                     throw new Error('Failed to get media URL from upload.');
                 }

                 const newMedia = await this.mediaRepo.createMedia({
                    punchListItemId: itemId,
                    mediaUrl: mediaUrl, // Use the URL from the upload middleware
                    mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video', // Determine type
                    caption: req.body.caption || null, // Add caption from request body if provided
                    uploadedById: userId,
                 });
                 uploadedMedia.push(newMedia);
            }
             res.status(201).json(uploadedMedia);

        } catch (error) {
            logger.error(`Error uploading media for punch list item ${itemId}:`, error);
            // TODO: Implement rollback for uploaded files to R2 if DB insertion fails for some
            res.status(500).json({ message: 'Failed to upload media.' });
        }
    }

    async deletePunchListItemMedia(req: TypedRequestParams<{ itemId: number; mediaId: number }> & AuthenticatedRequest, res: Response): Promise<void> {
         // Note: itemId is included in path but mediaId is sufficient to delete a single media item
         // We might keep itemId for context or future permission checks
        const itemId = Number(req.params.itemId); // Punch list item ID
        const mediaId = Number(req.params.mediaId); // Specific media item ID

        if (isNaN(itemId) || isNaN(mediaId)) {
             res.status(400).json({ message: 'Invalid IDs provided.' });
             return;
        }

         // Optional: Verify the media item belongs to this punch list item and user has permissions

        try {
            // The repository method handles deleting the file from storage and the DB record
             const deletedMedia = await this.mediaRepo.deleteMedia(mediaId);

             if (!deletedMedia) {
                 res.status(404).json({ message: 'Media item not found.' });
                 return;
             }

            res.status(200).json({ message: 'Media item deleted successfully.', deletedMediaId: mediaId });

        } catch (error: any) {
            logger.error(`Error deleting media ${mediaId} for punch list item ${itemId}:`, error);
             res.status(500).json({ message: `Failed to delete media: ${error.message}` });
        }
    }

    // Potentially add a method to get media specifically for a punch list item if not always eager-loaded
    // async getPunchListItemMedia(req: TypedRequestParams<{ itemId: number }>, res: Response): Promise<void> {
    //     const itemId = Number(req.params.itemId);
    //      if (isNaN(itemId)) {
    //          res.status(400).json({ message: 'Invalid punch list item ID' });
    //          return;
    //      }
    //      try {
    //          const media = await this.mediaRepo.getMediaForPunchListItem(itemId);
    //          res.json(media);
    //      } catch (error) {
    //           logger.error(`Error fetching media for punch list item ${itemId}:`, error);
    //           res.status(500).json({ message: 'Failed to fetch media.' });
    //      }
    // }
}

// Export an instance
export const punchListController = new PunchListController();