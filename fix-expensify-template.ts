/**
 * Fix Expensify template by using the correct API approach
 */

async function fixExpensifyTemplate() {
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';

  console.log('Testing Expensify template fix approaches...\n');

  // Test 1: Use job with template parameter separately
  console.log('1. Testing separate template parameter...');
  const jobDescription = {
    type: 'file',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    onReceive: {
      immediateResponse: ['returnRandomFileName'],
    },
    inputSettings: {
      type: 'combinedReportData',
      filters: {
        reportState: 'APPROVED',
        startDate: '2024-01-01',
        endDate: '2025-06-18',
      },
    },
    outputSettings: {
      fileExtension: 'csv',
    },
  };

  const params1 = new URLSearchParams();
  params1.append('requestJobDescription', JSON.stringify(jobDescription));
  params1.append('template', 'transactionID,amount,tag\n<#list reports as report><#list report.transactionList as expense>${expense.transactionID},${expense.amount?c},${(expense.tag!"")?csv}\n</#list></#list>');

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params1.toString(),
    });
    
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}`);
    
    if (!responseText.includes('Authentication error')) {
      console.log('✅ Template fix successful!');
      return;
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }

  // Test 2: Different template format
  console.log('\n2. Testing minimal template format...');
  const params2 = new URLSearchParams();
  params2.append('requestJobDescription', JSON.stringify(jobDescription));
  params2.append('template', '<#list reports as report><#list report.transactionList as expense>${expense.transactionID}</#list></#list>');

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params2.toString(),
    });
    
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}`);
    
    if (!responseText.includes('Authentication error')) {
      console.log('✅ Minimal template successful!');
      return;
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }

  // Test 3: Use download type instead of file
  console.log('\n3. Testing download type with template...');
  const downloadJob = {
    type: 'download',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    fileName: 'expenses.csv',
    inputSettings: {
      type: 'combinedReportData',
      filters: {
        reportState: 'APPROVED',
      },
    },
  };

  const params3 = new URLSearchParams();
  params3.append('requestJobDescription', JSON.stringify(downloadJob));
  params3.append('template', 'ID,Amount\n<#list reports as report><#list report.transactionList as expense>${expense.transactionID},${expense.amount?c}\n</#list></#list>');

  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params3.toString(),
    });
    
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}`);
    
    if (!responseText.includes('Authentication error')) {
      console.log('✅ Download template successful!');
      return;
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }

  console.log('\n❌ Template fix not found - credentials may need different API access level');
}

fixExpensifyTemplate().catch(console.error);