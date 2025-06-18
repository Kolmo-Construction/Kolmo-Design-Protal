/**
 * Test script to isolate Expensify authentication issues
 */

async function testExpensifyAuthOnly() {
  console.log('=== Testing Expensify Authentication Only ===\n');
  
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
  
  if (!partnerUserID || !partnerUserSecret) {
    console.log('❌ Credentials not found in environment');
    return;
  }
  
  console.log('Credentials found:');
  console.log(`  Partner ID: ${partnerUserID.substring(0, 10)}...`);
  console.log(`  Secret: ${partnerUserSecret.substring(0, 10)}...`);
  
  // Test 1: Minimal payload without template
  console.log('\n1. Testing minimal payload (no template)...');
  
  const minimalJobDescription = {
    type: 'file',
    credentials: {
      partnerUserID: partnerUserID,
      partnerUserSecret: partnerUserSecret
    },
    onReceive: {
      immediateResponse: ['returnRandomFileName']
    },
    inputSettings: {
      type: 'combinedReportData',
      filters: {
        reportState: 'APPROVED',
        startDate: '2025-01-01',
        endDate: '2025-06-18'
      }
    },
    outputSettings: {
      fileExtension: 'json'
    }
  };
  
  const params1 = new URLSearchParams();
  params1.append('requestJobDescription', JSON.stringify(minimalJobDescription));
  
  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params1.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   ❌ Authentication failing even without template');
      return;
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   ✅ Authentication working! Template needed for data.');
    } else {
      console.log('   ✅ Success response received');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
    return;
  }
  
  // Test 2: Add simple template
  console.log('\n2. Testing with simple template...');
  
  const simpleTemplate = 'ID,Amount\n<#list reports as report><#list report.transactionList as expense>${expense.transactionID},${expense.amount?c}\n</#list></#list>';
  
  const templateJobDescription = {
    ...minimalJobDescription,
    outputSettings: {
      fileExtension: 'csv'
    },
    template: simpleTemplate
  };
  
  const params2 = new URLSearchParams();
  params2.append('requestJobDescription', JSON.stringify(templateJobDescription));
  
  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params2.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText.substring(0, 200)}...`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   ❌ Template causing authentication issues');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   ⚠️  Template not being recognized');
    } else {
      console.log('   ✅ Template working correctly');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }
  
  console.log('\n=== Authentication Test Complete ===');
}

testExpensifyAuthOnly().catch(console.error);