/**
 * Test the exact format from the attached documentation
 */

async function testDocumentationFormat() {
  console.log('=== Testing Documentation Format ===\n');
  
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
  
  // Build template to avoid TypeScript parsing issues
  const templateParts = [
    '<#compress>',
    '[<#list reports as report>',
    '{"reportID":"' + '${(report.reportID!\'\')' + '?js_string}' + '",',
    '"reportName":"' + '${(report.reportName!\'\')' + '?js_string}' + '",',
    '"status":"' + '${(report.status!\'\')' + '?js_string}' + '",',
    '"total":' + '${(report.total!0)' + '?c}' + ',',
    '"currency":"' + '${(report.currency!\'USD\')' + '?js_string}' + '",',
    '"expenses":[<#list report.transactionList as expense>',
    '{"transactionID":"' + '${(expense.transactionID!\'\')' + '?js_string}' + '",',
    '"amount":' + '${(expense.amount!0)' + '?c}' + ',',
    '"category":"' + '${(expense.category!\'\')' + '?js_string}' + '",',
    '"tag":"' + '${(expense.tag!\'\')' + '?js_string}' + '",',
    '"merchant":"' + '${(expense.merchant!\'\')' + '?js_string}' + '",',
    '"comment":"' + '${(expense.comment!\'\')' + '?js_string}' + '",',
    '"created":"' + '${(expense.created!\'\')' + '?js_string}' + '",',
    '"modified":"' + '${(expense.modified!\'\')' + '?js_string}' + '"',
    '<#if expense.receipt??>',
    ',"receipt":{"receiptID":"' + '${(expense.receipt.receiptID!\'\')' + '?js_string}' + '",',
    '"filename":"' + '${(expense.receipt.filename!\'\')' + '?js_string}' + '"}',
    '</#if>',
    '}<#if expense_has_next>,</#if>',
    '</#list>]',
    '}<#if report_has_next>,</#if>',
    '</#list>]',
    '</#compress>'
  ];
  const exportTemplate = templateParts.join('');

  // 1. Test without template first
  console.log('1. Testing without template (baseline)...');
  const basicRequestJobDescription = {
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
      fileExtension: "json"
    }
  };

  const basicFormData = new URLSearchParams();
  basicFormData.append('requestJobDescription', JSON.stringify(basicRequestJobDescription));

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
    
    if (!responseText.includes('Authentication error')) {
      console.log('   ✅ Basic authentication working');
    } else {
      console.log('   ❌ Basic authentication failing');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
    return;
  }

  // 2. Test with template using documentation format
  console.log('\n2. Testing with template (documentation format)...');
  
  const templateFormData = new URLSearchParams();
  templateFormData.append('requestJobDescription', JSON.stringify(basicRequestJobDescription));
  templateFormData.append('template', exportTemplate);

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
    console.log(`   Response: ${responseText.substring(0, 300)}...`);
    
    if (responseText.includes('Authentication error')) {
      console.log('   ❌ Template causing authentication issues');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('   ⚠️  Template parameter not recognized');
    } else {
      console.log('   ✅ Template working correctly!');
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        if (Array.isArray(data)) {
          console.log(`   📊 Received ${data.length} expense records`);
        } else {
          console.log('   📄 Received file response or other format');
        }
      } catch (parseError) {
        console.log('   📄 Received non-JSON response (likely file)');
      }
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  console.log('\n=== Documentation Format Test Complete ===');
}

testDocumentationFormat().catch(console.error);