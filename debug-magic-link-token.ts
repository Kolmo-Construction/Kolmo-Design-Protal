/**
 * Debug script to test magic link token storage and retrieval
 */
import { storage } from './server/storage';

async function debugMagicLinkToken() {
  try {
    console.log('=== Magic Link Token Debug ===');
    
    // Get the user that was just created
    const user = await storage.users.getUserByEmail('kolmo.constructions@gmail.com');
    console.log('Found user:', user ? `ID ${user.id}, ${user.firstName} ${user.lastName}` : 'Not found');
    
    if (!user) {
      console.log('User not found, exiting');
      return;
    }
    
    // Test token generation and storage
    const testToken = 'test-token-' + Date.now();
    const testExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    console.log('\n--- Testing token storage ---');
    console.log('Storing token:', testToken);
    console.log('Expiry:', testExpiry);
    
    // Update user with magic link token
    const updatedUser = await storage.users.updateUserMagicLinkToken(user.id, testToken, testExpiry);
    console.log('Updated user result:', {
      id: updatedUser.id,
      email: updatedUser.email,
      magicLinkToken: updatedUser.magicLinkToken,
      magicLinkExpiry: updatedUser.magicLinkExpiry
    });
    
    console.log('\n--- Testing token retrieval ---');
    // Try to retrieve the user by the token
    const retrievedUser = await storage.users.getUserByMagicLinkToken(testToken);
    console.log('Retrieved user by token:', retrievedUser ? `ID ${retrievedUser.id}, token: ${retrievedUser.magicLinkToken}` : 'Not found');
    
    // Check the database directly
    console.log('\n--- Direct database check ---');
    
  } catch (error) {
    console.error('Error in debug:', error);
  }
}

debugMagicLinkToken().then(() => {
  console.log('Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
});