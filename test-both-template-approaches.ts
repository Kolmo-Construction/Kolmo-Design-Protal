/**
 * Test both template approaches from the documentation:
 * 1. Template as separate form parameter
 * 2. Template inside requestJobDescription JSON
 */

async function testBothTemplateApproaches() {
  console.log('=== Testing Both Template Approaches ===\n');
  
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
  
  if (!partnerUserID || !partnerUserSecret) {
    console.log('Missing credentials');
    return;
  }

  // Simple CSV template
  const simpleTemplate = 'transactionID,amount,tag\n' +
    '<#list reports as report>' +
    '<#list report.transactionList as expense>' +
    '${expense.transactionID},${expense.amount?c},"${expense.tag!""}"' +
    '\n</#list></#list>';

  const baseRequestJobDescription = {
    type: "file",
    credentials: {
      partnerUserID: partnerUserID,
      partnerUserSecret: partnerUserSecret
    },
    onReceive: {
      immediateResponse: ["returnRandomFileName"]
    },
    inputSettings: {
      type: "combinedReportData",
      filters: {
        startDate: "2025-05-01",
        endDate: "2025-05-31"
      }
    },
    outputSettings: {
      fileExtension: "csv"
    }
  };

  // APPROACH 1: Template as separate form parameter (from first document)
  console.log('1. Testing template as separate form parameter...');
  const approach1FormData = new URLSearchParams();
  approach1FormData.append('requestJobDescription', JSON.stringify(baseRequestJobDescription));
  approach1FormData.append('template', simpleTemplate);

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: approach1FormData.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   Result: Authentication failed with separate template parameter');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   Result: Template parameter not recognized');
    } else {
      console.log('   Result: Success with separate template parameter!');
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  console.log('\n2. Testing template inside requestJobDescription JSON...');
  
  // APPROACH 2: Template inside requestJobDescription (from second document)
  const approach2RequestJobDescription = {
    ...baseRequestJobDescription,
    template: simpleTemplate  // Add template inside the JSON
  };

  const approach2FormData = new URLSearchParams();
  approach2FormData.append('requestJobDescription', JSON.stringify(approach2RequestJobDescription));

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: approach2FormData.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   Result: Authentication failed with template in JSON');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   Result: Template inside JSON not recognized');
    } else {
      console.log('   Result: Success with template inside JSON!');
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  console.log('\n3. Testing without template (baseline)...');
  
  // BASELINE: No template at all
  const baselineFormData = new URLSearchParams();
  baselineFormData.append('requestJobDescription', JSON.stringify(baseRequestJobDescription));

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: baselineFormData.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   Result: Basic authentication failed');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   Result: Authentication working, template required');
    } else {
      console.log('   Result: Success without template (unexpected)');
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
  }

  console.log('\n=== Comparison Complete ===');
}

testBothTemplateApproaches().catch(console.error);