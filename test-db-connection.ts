import { db } from './server/db';
import { users, projects, punchListItems, updateMedia } from './shared/schema';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test users table
    console.log('Querying users table...');
    const allUsers = await db.select().from(users).limit(1);
    console.log(`Found ${allUsers.length} users`);
    
    // Test projects table
    console.log('Querying projects table...');
    const allProjects = await db.select().from(projects).limit(1);
    console.log(`Found ${allProjects.length} projects`);
    
    // Test punchListItems table with photoUrl
    console.log('Querying punch list items table...');
    const punchItems = await db.select().from(punchListItems).limit(1);
    console.log(`Found ${punchItems.length} punch list items`);
    if (punchItems.length > 0) {
      console.log('Punch list item has photoUrl:', 'photoUrl' in punchItems[0]);
    }
    
    // Test updateMedia table
    console.log('Querying update media table...');
    const mediaItems = await db.select().from(updateMedia).limit(1);
    console.log(`Found ${mediaItems.length} media items`);
    if (mediaItems.length > 0) {
      console.log('Update media has punchListItemId:', 'punchListItemId' in mediaItems[0]);
    }
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Error during database test:', error);
  } finally {
    process.exit(0);
  }
}

testConnection();