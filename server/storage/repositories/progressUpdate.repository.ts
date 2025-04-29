// server/storage/repositories/progressUpdate.repository.ts
import { NeonDatabase, PgTransaction } from 'drizzle-orm/neon-serverless';
import { eq, and, or, sql, desc, asc } from 'drizzle-orm';
import * as schema from '../../../shared/schema';
import { db } from '../../db';
import { HttpError } from '../../errors';
import { ProgressUpdateWithDetails } from '../types';
// Import Media Repository
import { MediaRepository } from './media.repository';
// Don't import storage to avoid circular dependency

// Create MediaStorage class for media handling
class MediaStorage {
  async uploadFile(file: any): Promise<string> {
    return "dummy-url";
  }
  
  async deleteFile(url: string): Promise<void> {
    // No operation needed for now
  }
}

// Create a simple logger for the media repository
const simpleLogger = {
  log: (level: string, message: string) => {
    console.log(`[${level}] ${message}`);
  },
  logQuery: () => {} // Empty implementation to satisfy the Logger interface
};

// Interface for ProgressUpdate Repository
export interface IProgressUpdateRepository {
    getProgressUpdatesForProject(projectId: number): Promise<ProgressUpdateWithDetails[]>;
    // Transactional method combining update and media creation
    createProgressUpdateWithMedia(
        updateData: schema.InsertProgressUpdate,
        mediaItemsData: Omit<schema.InsertUpdateMedia, 'id' | 'createdAt'>[] // Media data without IDs
    ): Promise<ProgressUpdateWithDetails | null>;
    // Need method to get keys for R2 deletion before DB deletion
    getProgressUpdateWithMediaKeys(updateId: number): Promise<{ update: schema.ProgressUpdate, keys: string[] } | null>;
    deleteProgressUpdate(updateId: number): Promise<boolean>;
}

// Implementation
class ProgressUpdateRepository implements IProgressUpdateRepository {
    private dbOrTx: NeonDatabase<typeof schema> | PgTransaction<any, any, any>;
    private mediaRepo: MediaRepository; // Inject media repo

    constructor(
        databaseOrTx: NeonDatabase<typeof schema> | any = db,
        mediaRepoInstance?: MediaRepository
    ) {
        this.dbOrTx = databaseOrTx;
        // Create a new MediaRepository instance if one is not provided
        this.mediaRepo = mediaRepoInstance || new MediaRepository(databaseOrTx, new MediaStorage(), simpleLogger);
    }

    async getProgressUpdatesForProject(projectId: number): Promise<ProgressUpdateWithDetails[]> {
         try {
            const updates = await this.dbOrTx.query.progressUpdates.findMany({
                where: eq(schema.progressUpdates.projectId, projectId),
                orderBy: [desc(schema.progressUpdates.createdAt)],
                with: {
                    creator: { columns: { id: true, firstName: true, lastName: true } },
                    media: true // Use the correct relation name from schema
                }
            });
            
            // Filter/ensure creator exists and map to expected structure
            const validUpdates = updates
                .filter(u => u.creator)
                .map(update => ({
                    ...update,
                    author: update.creator, // Map creator to author for backwards compatibility
                    mediaItems: update.media // Map media to mediaItems for backwards compatibility
                }));
                
            return validUpdates as ProgressUpdateWithDetails[];
        } catch (error) {
            console.error(`Error fetching progress updates for project ${projectId}:`, error);
            throw new Error('Database error while fetching progress updates.');
        }
    }

    async createProgressUpdateWithMedia(
        updateData: schema.InsertProgressUpdate,
        mediaItemsData: Omit<schema.InsertUpdateMedia, 'id' | 'createdAt'>[]
    ): Promise<ProgressUpdateWithDetails | null> {
         // Ensure dbOrTx is the base db instance for transaction
         const baseDb = ('_.isTransaction' in this.dbOrTx && (this.dbOrTx as any)._.isTransaction)
            ? db // If called within transaction, use base db to start new one (or handle nested?) - check Drizzle docs for best practice
            : this.dbOrTx as NeonDatabase<typeof schema>;

         return baseDb.transaction(async (tx) => {
            // Use transaction instance for repository methods
            const txMediaRepo = new MediaRepository(tx, new MediaStorage(), simpleLogger);
            const txProgressRepo = new ProgressUpdateRepository(tx, txMediaRepo);

            // 1. Insert progress update
            const updateResult = await tx.insert(schema.progressUpdates)
                .values(updateData)
                .returning({ id: schema.progressUpdates.id });
            if (!updateResult || updateResult.length === 0) throw new Error("Failed to insert progress update.");
            const updateId = updateResult[0].id;

            // 2. Insert media items using MediaRepository
            if (mediaItemsData.length > 0) {
                const fullMediaData = mediaItemsData.map(m => ({
                    ...m,
                    updateId: updateId, // Link media to this update
                }));
                
                // Create each media item individually since createMultipleMediaItems is not available
                for (const mediaItem of fullMediaData) {
                    await txMediaRepo.createMedia(mediaItem);
                }
            }

            // 3. Fetch the complete result using the transaction instance
            const finalResult = await tx.query.progressUpdates.findFirst({
                where: eq(schema.progressUpdates.id, updateId),
                with: {
                    creator: { columns: { id: true, firstName: true, lastName: true } },
                    media: true, // Use the relation name from schema (media, not mediaItems)
                },
            });

            if (!finalResult || !finalResult.creator) throw new Error("Failed to retrieve created progress update with details.");
            
            // Map the result to match the expected ProgressUpdateWithDetails type
            const result = {
                ...finalResult,
                author: finalResult.creator,
                mediaItems: finalResult.media 
            } as ProgressUpdateWithDetails;
            
            return result;
        });
    }

     async getProgressUpdateWithMediaKeys(updateId: number): Promise<{ update: schema.ProgressUpdate, keys: string[] } | null> {
         const update = await this.dbOrTx.query.progressUpdates.findFirst({
             where: eq(schema.progressUpdates.id, updateId),
             columns: { id: true }, // Fetch only ID or needed fields
         });
         if (!update) return null;
         const keys = await this.mediaRepo.getMediaKeysForUpdate(updateId);
         return { update, keys };
     }


     async deleteProgressUpdate(updateId: number): Promise<boolean> {
          // Assumes R2 deletion is handled by caller using keys from getProgressUpdateWithMediaKeys
          const baseDb = ('_.isTransaction' in this.dbOrTx && (this.dbOrTx as any)._.isTransaction)
            ? db : this.dbOrTx as NeonDatabase<typeof schema>;

          return baseDb.transaction(async (tx) => {
              const txMediaRepo = new MediaRepository(tx, new MediaStorage(), simpleLogger);
              // 1. Delete associated media records first
              await txMediaRepo.deleteMediaForUpdate(updateId, tx);

              // 2. Delete the progress update itself
              const result = await tx.delete(schema.progressUpdates)
                .where(eq(schema.progressUpdates.id, updateId))
                .returning({ id: schema.progressUpdates.id });

             return result.length > 0;
          });
     }
}

// Export an instance for convenience
export const progressUpdateRepository = new ProgressUpdateRepository();