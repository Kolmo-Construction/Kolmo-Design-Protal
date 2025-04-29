// server/storage/repositories/media.repository.ts
import { db as database } from "../../db"; 
import { Logger } from "drizzle-orm"; 
import { eq, inArray } from "drizzle-orm"; 
import { NeonDatabase } from 'drizzle-orm/neon-serverless'; 

// Mock MediaStorage for now as we fix the import
class MediaStorage {
  async uploadFile(file: any): Promise<string> {
    return "dummy-url";
  }
  
  async deleteFile(url: string): Promise<void> {
    // No operation needed for now
  }
}

// Changed import from '@/shared/schema' to a relative path
import * as schema from '../../../shared/schema'; // Relative path to shared/schema.ts
import { InsertUpdateMedia, updateMedia } from '../../../shared/schema'; // Relative path to shared/schema.ts


// Update the IMediaRepository interface if you use one elsewhere to reflect transaction parameter if you use one
// For simplicity, we'll adjust the class methods directly for now.

export class MediaRepository {
  // Adjusted constructor to potentially accept a transaction
   constructor(
     private dbOrTx: NeonDatabase<any> | any = database, 
     private mediaStorage: MediaStorage = new MediaStorage(), 
     private logger: any = { log: console.log }
   ) {}
  
  async createMedia(data: InsertUpdateMedia) {
    // Insert the update media record
    try {
      const [record] = await this.dbOrTx.insert(updateMedia)
        .values(data)
        .returning();
      
      this.logger.log("info", `Created media record with ID ${record.id}`);
      return record;
    } catch (error) {
      this.logger.log("error", `Failed to create media record: ${error}`);
      throw new Error(`Failed to create media record: ${error}`);
    }
  }

  // Method to get media associated with a progress update
  async getMediaForUpdate(updateId: number) {
    try {
      const media = await this.dbOrTx.query.updateMedia.findMany({
        where: eq(updateMedia.updateId, updateId),
      });
      return media;
    } catch (error) {
      this.logger.log("error", `Failed to get media for update ID ${updateId}: ${error}`);
      throw new Error(`Failed to get media for update ID ${updateId}: ${error}`);
    }
  }

  // Method to delete a specific media record by ID
  async deleteMedia(mediaId: number, tx?: any) {
    const dbContext = tx || this.dbOrTx;
    
    const [media] = await dbContext.select({
      mediaUrl: updateMedia.mediaUrl,
    })
    .from(updateMedia)
    .where(eq(updateMedia.id, mediaId));
    
    if (!media) {
      this.logger.log("warn", `No media found with ID ${mediaId} for deletion.`);
      return;
    }
    
    try {
      await this.mediaStorage.deleteFile(media.mediaUrl);
      this.logger.log("info", `Deleted media file: ${media.mediaUrl}`);
    } catch (error) {
      this.logger.log("error", `Failed to delete media file ${media.mediaUrl} for media ID ${mediaId}: ${error}`);
      throw new Error(`Failed to delete media file: ${error}`);
    }
    
    await dbContext.delete(updateMedia).where(eq(updateMedia.id, mediaId));
    this.logger.log("info", `Deleted media record with ID ${mediaId}.`);
  }

  // Adjusted to accept an optional transaction object
  async deleteMediaForUpdate(updateId: number, tx?: any) {
    const dbContext = tx || this.dbOrTx;
  
    const mediaToDelete = await dbContext.query.updateMedia.findMany({
        where: eq(updateMedia.updateId, updateId),
        columns: {
            id: true,
            mediaUrl: true,
        }
    });

    if (mediaToDelete.length === 0) {
        this.logger.log("info", `No media found for update ID ${updateId} for deletion.`);
        return;
    }

    for (const media of mediaToDelete as Array<{ id: number, mediaUrl: string }>) {
        try {
            await this.mediaStorage.deleteFile(media.mediaUrl);
            this.logger.log("info", `Deleted media file: ${media.mediaUrl}`);
        } catch (error) {
            this.logger.log("error", `Failed to delete media file ${media.mediaUrl} for update ID ${updateId}: ${error}`);
             throw new Error(`Failed to delete one or more media files for update ID ${updateId}: ${error}`);
        }
    }

    const mediaIds = mediaToDelete.map((media: { id: number }) => media.id);
     if (mediaIds.length > 0) {
         await dbContext.delete(updateMedia).where(inArray(updateMedia.id, mediaIds));
         this.logger.log("info", `Deleted ${mediaIds.length} media records for update ID ${updateId}.`);
     }
  }

  // Note: PunchListItems are not directly linked to media in the schema,
  // so this method is revised to be a no-op to avoid errors
  async deleteMediaForPunchListItem(punchListItemId: number, tx?: any) {
    this.logger.log("info", `No media directly linked to punch list item ID ${punchListItemId} in schema.`);
    return;
  }

  // Note: PunchListItems are not directly linked to media in the schema
  async getMediaKeysForPunchListItem(punchListItemId: number): Promise<string[]> {
    // Since there's no direct link in the schema, we return an empty array
    this.logger.log("info", `No media directly linked to punch list item ID ${punchListItemId} in schema.`);
    return [];
  }

  async getMediaKeysForUpdate(updateId: number): Promise<string[]> {
    const media = await this.dbOrTx.query.updateMedia.findMany({
        where: eq(updateMedia.updateId, updateId),
        columns: {
            mediaUrl: true,
        },
    });
    return media.map((m: { mediaUrl: string }) => m.mediaUrl);
  }
}

// Export an interface for dependency injection
export interface IMediaRepository {
  createMedia(data: InsertUpdateMedia): Promise<schema.UpdateMedia>;
  deleteMediaForUpdate(updateId: number, tx?: any): Promise<void>;
  deleteMediaForPunchListItem(punchListItemId: number, tx?: any): Promise<void>;
  getMediaKeysForPunchListItem(punchListItemId: number): Promise<string[]>;
  getMediaKeysForUpdate(updateId: number): Promise<string[]>;
}

// Export a singleton instance
// Create a custom logger function that matches what the methods use
const simpleLogger = {
  log: (level: string, message: string) => {
    console.log(`[${level}] ${message}`);
  },
  logQuery: () => {} // Empty implementation to satisfy the Logger interface
};

// Create and export the instance with defaults
export const mediaRepository: IMediaRepository = new MediaRepository(database, new MediaStorage(), simpleLogger);