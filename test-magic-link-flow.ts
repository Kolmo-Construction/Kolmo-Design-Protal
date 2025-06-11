/**
 * Test script to debug magic link token storage and retrieval
 */

import { storage } from "./server/storage/index";

async function testMagicLinkFlow() {
  try {
    console.log('=== Testing Magic Link Token Flow ===');
    
    // Test 1: Check if we can find existing users with magic link tokens
    console.log('\n1. Checking existing users...');
    const allUsers = await storage.users.getAllUsers();
    console.log(`Found ${allUsers.length} users in database`);
    
    // Find users with magic link tokens
    const usersWithTokens = allUsers.filter(user => user.magicLinkToken);
    console.log(`Users with magic link tokens: ${usersWithTokens.length}`);
    
    if (usersWithTokens.length > 0) {
      console.log('Users with tokens:');
      usersWithTokens.forEach(user => {
        console.log(`- User ${user.id} (${user.email}): token=${user.magicLinkToken}, expiry=${user.magicLinkExpiry}`);
      });
      
      // Test token retrieval
      console.log('\n2. Testing token retrieval...');
      const firstTokenUser = usersWithTokens[0];
      const retrievedUser = await storage.users.getUserByMagicLinkToken(firstTokenUser.magicLinkToken!);
      
      if (retrievedUser) {
        console.log(`✓ Successfully retrieved user ${retrievedUser.id} by token`);
      } else {
        console.log('✗ Failed to retrieve user by token');
      }
    }
    
    // Test 2: Create a test magic link token
    console.log('\n3. Testing token creation...');
    const testUser = allUsers.find(user => user.role === 'client');
    
    if (testUser) {
      const testToken = 'test-token-' + Date.now();
      const testExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      console.log(`Creating test token for user ${testUser.id}: ${testToken}`);
      
      // Store the token
      await storage.users.updateUserMagicLinkToken(testUser.id, testToken, testExpiry);
      
      // Try to retrieve it
      const retrievedByToken = await storage.users.getUserByMagicLinkToken(testToken);
      
      if (retrievedByToken) {
        console.log(`✓ Successfully stored and retrieved test token`);
        console.log(`Retrieved user: ${retrievedByToken.id}, token: ${retrievedByToken.magicLinkToken}`);
        
        // Clean up - remove the test token
        await storage.users.updateUserMagicLinkToken(testUser.id, null, null);
        console.log('✓ Test token cleaned up');
      } else {
        console.log('✗ Failed to retrieve user by test token');
      }
    } else {
      console.log('No client users found for testing');
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error during magic link test:', error);
  }
}

// Run the test
testMagicLinkFlow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});