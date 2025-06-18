/**
 * Test the exact template format from the attached file
 */

async function testExactTemplateFormat() {
  console.log('=== Testing Exact Template Format ===\n');
  
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
  
  if (!partnerUserID || !partnerUserSecret) {
    console.log('❌ Missing credentials');
    return;
  }

  // Simple template to test format
  const simpleTemplate = 'reportID,amount,tag\n' +
    '<#list reports as report>' +
    '<#list report.transactionList as expense>' +
    '${expense.transactionID},${expense.amount?c},"${expense.tag!""}"' +
    '\n</#list></#list>';

  const requestJobDescription = {
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

  console.log('1. Testing without template (baseline)...');
  
  // Test without template first
  const basicFormData = new URLSearchParams();
  basicFormData.append('requestJobDescription', JSON.stringify(requestJobDescription));

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: basicFormData.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   ❌ Basic authentication failing');
      return;
    } else {
      console.log('   ✅ Basic authentication working');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
    return;
  }

  console.log('\n2. Testing with simple template...');
  
  // Test with template
  const templateFormData = new URLSearchParams();
  templateFormData.append('requestJobDescription', JSON.stringify(requestJobDescription));
  templateFormData.append('template', simpleTemplate);

  console.log('   Template:', simpleTemplate.replace(/\n/g, '\\n'));
  console.log('   Payload preview:', templateFormData.toString().substring(0, 200) + '...');

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: templateFormData.toString()
    });
    
    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   ❌ Template causing authentication issues');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   ⚠️  Template parameter not being recognized');
    } else {
      console.log('   ✅ Template working correctly!');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  console.log('\n=== Test Complete ===');
}

testExactTemplateFormat().catch(console.error);