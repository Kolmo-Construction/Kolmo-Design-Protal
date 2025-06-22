/**
 * Direct Zoho debug test script
 */
import { zohoExpenseService } from './server/services/zoho-expense.service';

async function debugZohoDirect() {
  console.log('=== ZOHO DIRECT DEBUG START ===');
  
  try {
    const service = zohoExpenseService;
    
    // 1. Check basic configuration
    console.log('1. Configuration Check:');
    console.log('   - Service configured:', service.isConfigured());
    console.log('   - Client ID set:', !!process.env.ZOHO_CLIENT_ID);
    console.log('   - Client Secret set:', !!process.env.ZOHO_CLIENT_SECRET);
    console.log('   - Redirect URI:', process.env.ZOHO_REDIRECT_URI);
    
    // 2. Initialize and check tokens
    console.log('\n2. Token Check:');
    await service.initialize();
    const tokens = service.getTokens();
    console.log('   - Tokens available:', !!tokens);
    if (tokens) {
      console.log('   - Access token length:', tokens.access_token?.length);
      console.log('   - Token expires at:', new Date(tokens.expires_at));
      console.log('   - Token expired:', Date.now() >= tokens.expires_at);
    }
    
    // 3. Test basic connection
    console.log('\n3. Basic Connection Test:');
    try {
      const result = await service.testConnection();
      console.log('   - Connection result:', result);
    } catch (error) {
      console.log('   - Connection error:', error);
    }
    
    // 4. Test organizations endpoint directly
    console.log('\n4. Organizations Test:');
    try {
      if (tokens) {
        const orgs = await service.getOrganizations();
        console.log('   - Organizations count:', orgs.length);
        console.log('   - Organizations:', orgs);
      } else {
        console.log('   - Skipped - no tokens');
      }
    } catch (error) {
      console.log('   - Organizations error:', error);
    }
    
    // 5. Test budget tracking
    console.log('\n5. Budget Tracking Test:');
    try {
      if (tokens) {
        const expenses = await service.getAllExpenses();
        console.log('   - Expenses count:', expenses.length);
        console.log('   - Sample expense:', expenses[0] || 'none');
      } else {
        console.log('   - Skipped - no tokens');
      }
    } catch (error) {
      console.log('   - Budget tracking error:', error);
    }
    
    console.log('\n=== ZOHO DIRECT DEBUG END ===');
    
  } catch (error) {
    console.error('=== ZOHO DIRECT DEBUG ERROR ===');
    console.error('Error:', error);
    console.log('=== ZOHO DIRECT DEBUG END ===');
  }
}

// Run the debug
debugZohoDirect().catch(console.error);