const { StreamChat } = require('stream-chat');

async function testStreamChatConnection() {
  console.log('Testing Stream Chat connection...');
  
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  
  console.log('API Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING');
  console.log('API Secret:', apiSecret ? 'Present' : 'MISSING');
  
  if (!apiKey || !apiSecret) {
    console.error('Missing Stream Chat credentials');
    return;
  }
  
  try {
    // Initialize server client
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    console.log('Server client created successfully');
    
    // Test creating a user
    const testUserId = 'test-admin-1';
    await serverClient.upsertUser({
      id: testUserId,
      name: 'Test Admin'
    });
    console.log('User created successfully');
    
    // Test creating a token
    const token = serverClient.createToken(testUserId);
    console.log('Token created:', token.substring(0, 20) + '...');
    
    // Test connecting with client
    const clientInstance = StreamChat.getInstance(apiKey);
    await clientInstance.connectUser(
      { id: testUserId, name: 'Test Admin' },
      token
    );
    console.log('Client connected successfully');
    
    // Clean up
    await clientInstance.disconnectUser();
    console.log('Disconnected successfully');
    
    console.log('✅ Stream Chat connection test PASSED');
  } catch (error) {
    console.error('❌ Stream Chat connection test FAILED:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
}

testStreamChatConnection();