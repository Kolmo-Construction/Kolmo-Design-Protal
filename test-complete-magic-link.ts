/**
 * Test script to create a fresh magic link and verify the complete flow
 */

import { storage } from "./server/storage/index";

async function testCompleteMagicLinkFlow() {
  try {
    console.log('=== Testing Complete Magic Link Flow ===');
    
    // Find a test user to create a magic link for
    const allUsers = await storage.users.getAllUsers();
    const testUser = allUsers.find(user => user.role === 'client');
    
    if (!testUser) {
      console.log('No client user found for testing');
      return;
    }
    
    console.log(`\nTesting with user: ${testUser.email} (ID: ${testUser.id})`);
    
    // Import the magic link creation function
    const { createAndSendMagicLink } = await import('./server/auth');
    
    // Create a magic link for this user
    console.log('\n1. Creating magic link...');
    const success = await createAndSendMagicLink(testUser.email);
    console.log(`Magic link creation result: ${success}`);
    
    // Check if the token was stored
    console.log('\n2. Checking if token was stored...');
    const updatedUser = await storage.users.getUserByEmail(testUser.email);
    
    if (updatedUser && updatedUser.magicLinkToken) {
      console.log(`✓ Token stored: ${updatedUser.magicLinkToken}`);
      console.log(`✓ Expiry: ${updatedUser.magicLinkExpiry}`);
      
      // Test token retrieval
      console.log('\n3. Testing token retrieval...');
      const retrievedUser = await storage.users.getUserByMagicLinkToken(updatedUser.magicLinkToken);
      
      if (retrievedUser) {
        console.log(`✓ Successfully retrieved user by token`);
        console.log(`Retrieved user ID: ${retrievedUser.id}, Email: ${retrievedUser.email}`);
        
        // Test the complete verification flow
        console.log('\n4. Testing verification flow...');
        const { verifyMagicTokenAndGetUser } = await import('./server/auth');
        
        const verifiedUser = await verifyMagicTokenAndGetUser(updatedUser.magicLinkToken);
        
        if (verifiedUser) {
          console.log(`✓ Magic link verification successful`);
          console.log(`Verified user ID: ${verifiedUser.id}`);
          
          // Check that token was cleared after verification
          const tokenCheckAfterVerification = await storage.users.getUserByMagicLinkToken(updatedUser.magicLinkToken);
          if (!tokenCheckAfterVerification) {
            console.log(`✓ Token properly cleared after verification`);
          } else {
            console.log(`✗ Token was not cleared after verification`);
          }
        } else {
          console.log(`✗ Magic link verification failed`);
        }
      } else {
        console.log(`✗ Failed to retrieve user by token`);
      }
    } else {
      console.log(`✗ No token was stored for user`);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error during complete magic link test:', error);
  }
}

// Run the test
testCompleteMagicLinkFlow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});