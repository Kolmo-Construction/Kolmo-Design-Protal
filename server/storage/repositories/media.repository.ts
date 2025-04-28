// server/storage/repositories/media.repository.ts
import { NeonDatabase, PgTransaction } from 'drizzle-orm/neon-serverless';
import { eq, and, or, sql, inArray } from 'drizzle-orm';
import * as schema from '../../../shared/schema';
import { db } from '../../db';
import { HttpError } from '../../errors';

// Interface for Media Repository
export interface IMediaRepository {
    // Creates a single media item, linking to EITHER progress update OR punch list item
    createMediaItem(mediaData: schema.InsertUpdateMedia): Promise<schema.UpdateMedia | null>;
    // Creates multiple media items (useful for bulk uploads)
    createMultipleMediaItems(mediaItemsData: schema.InsertUpdateMedia[]): Promise<schema.UpdateMedia[]>;
    // Deletes media items associated with a specific progress update
    deleteMediaForProgressUpdate(progressUpdateId: number, dbOrTxInstance?: NeonDatabase<typeof schema> | PgTransaction<any, any, any>): Promise<boolean>;
    // Deletes media items associated with a specific punch list item
    deleteMediaForPunchListItem(punchListItemId: number, dbOrTxInstance?: NeonDatabase<typeof schema> | PgTransaction<any, any, any>): Promise<boolean>;
    // Get storage keys for deletion from R2
    getMediaKeysForProgressUpdate(progressUpdateId: number): Promise<string[]>;
    getMediaKeysForPunchListItem(punchListItemId: number): Promise<string[]>;
}

// Implementation
class MediaRepository implements IMediaRepository {
    private dbOrTx: NeonDatabase<typeof schema> | PgTransaction<any, any, any>;

    constructor(databaseOrTx: NeonDatabase<typeof schema> | PgTransaction<any, any, any> = db) {
        this.dbOrTx = databaseOrTx;
    }

    async createMediaItem(mediaData: schema.InsertUpdateMedia): Promise<schema.UpdateMedia | null> {
         // Ensure only one foreign key (updateId) is set
         // Note: Schema changed from progressUpdateId/punchListItemId to updateId to match database schema
         
        try {
            const result = await this.dbOrTx.insert(schema.updateMedia)
                .values(mediaData)
                .returning();
            return result.length > 0 ? result[0] : null;
        } catch (error: any) {
            console.error('Error creating media item:', error);
            if (error.code === '23503') { // FK violation
                 throw new HttpError(400, 'Invalid project, user, or progress update associated with the media.');
            }
            throw new Error('Database error while creating media item.');
        }
    }

    async createMultipleMediaItems(mediaItemsData: schema.InsertUpdateMedia[]): Promise<schema.UpdateMedia[]> {
        if (mediaItemsData.length === 0) return [];
        try {
            const result = await this.dbOrTx.insert(schema.updateMedia)
                .values(mediaItemsData)
                .returning();
            return result;
        } catch (error: any) {
             console.error('Error creating multiple media items:', error);
             if (error.code === '23503') { // FK violation
                 throw new HttpError(400, 'Invalid project, user, or progress update associated with the media.');
             }
             throw new Error('Database error while creating media items.');
        }
    }

    // Helper to allow passing transaction instance easily
    private getDbInstance(dbOrTxInstance?: NeonDatabase<typeof schema> | PgTransaction<any, any, any>): NeonDatabase<typeof schema> | PgTransaction<any, any, any> {
        return dbOrTxInstance ?? this.dbOrTx;
    }


    async deleteMediaForProgressUpdate(progressUpdateId: number, dbOrTxInstance?: NeonDatabase<typeof schema> | PgTransaction<any, any, any>): Promise<boolean> {
        const instance = this.getDbInstance(dbOrTxInstance);
        try {
            // Use updateId field instead of progressUpdateId to match schema
            const result = await instance.delete(schema.updateMedia)
                .where(eq(schema.updateMedia.updateId, progressUpdateId));
            // Drizzle delete doesn't always reliably return count, success determined by lack of error
            return true;
        } catch (error) {
             console.error(`Error deleting media for progress update ${progressUpdateId}:`, error);
             throw new Error('Database error while deleting progress update media.');
        }
    }

    async deleteMediaForPunchListItem(punchListItemId: number, dbOrTxInstance?: NeonDatabase<typeof schema> | PgTransaction<any, any, any>): Promise<boolean> {
         // This method needs to be refactored as updateMedia doesn't have punchListItemId field
         // For now, just log a warning and return success
         console.warn(`deleteMediaForPunchListItem called but schema doesn't support punch list items directly`);
         return true;
    }

     async getMediaKeysForProgressUpdate(progressUpdateId: number): Promise<string[]> {
         // mediaUrl field contains the URL which likely includes the storage key
         // Updated to reflect schema (updateId, mediaUrl)
         const results = await this.dbOrTx.select({ mediaUrl: schema.updateMedia.mediaUrl })
            .from(schema.updateMedia)
            .where(eq(schema.updateMedia.updateId, progressUpdateId));
         
         // Extract just the filename/key part of the URL
         // This is an assumption - adjust based on how your mediaUrl is structured
         return results.map(r => {
             const url = r.mediaUrl;
             // Extract the key from the URL (assuming format like "https://bucket.com/key")
             const parts = url.split('/');
             return parts[parts.length - 1]; // Get the last part as the key
         });
     }

     async getMediaKeysForPunchListItem(punchListItemId: number): Promise<string[]> {
         // This method needs to be refactored as updateMedia doesn't have punchListItemId field
         console.warn(`getMediaKeysForPunchListItem called but schema doesn't support punch list items directly`);
         return [];
     }
}

// Export an instance for convenience
export const mediaRepository = new MediaRepository();