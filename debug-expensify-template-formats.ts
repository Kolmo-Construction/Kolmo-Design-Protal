/**
 * Test different Expensify template formats to find one that works
 */

async function testExpensifyTemplateFormats() {
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';

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
        reportState: 'APPROVED,REIMBURSED',
        startDate: '2024-01-01',
        endDate: '2025-06-18',
      },
    },
    outputSettings: {
      fileExtension: 'json',
    },
  };

  // Test 1: Very minimal template
  console.log('Testing minimal template...');
  const minimalTemplate = '${reports}';
  await testTemplate('Minimal', minimalTemplate, jobDescription, baseURL);

  // Test 2: Simple list template
  console.log('\nTesting simple list template...');
  const simpleTemplate = '<#list reports as report>${report}</#list>';
  await testTemplate('Simple List', simpleTemplate, jobDescription, baseURL);

  // Test 3: JSON array template
  console.log('\nTesting JSON array template...');
  const jsonTemplate = '[<#list reports as report>"${report.reportID}"<#if report_has_next>,</#if></#list>]';
  await testTemplate('JSON Array', jsonTemplate, jobDescription, baseURL);

  // Test 4: Expense-only template
  console.log('\nTesting expense-only template...');
  const expenseTemplate = '<#list reports as report><#list report.transactionList as expense>${expense.transactionID}</#list></#list>';
  await testTemplate('Expense Only', expenseTemplate, jobDescription, baseURL);

  // Test 5: CSV format
  console.log('\nTesting CSV format...');
  const csvJobDescription = {
    ...jobDescription,
    outputSettings: { fileExtension: 'csv' }
  };
  const csvTemplate = 'ID,Amount<#list reports as report><#list report.transactionList as expense>\n${expense.transactionID},${expense.amount}</#list></#list>';
  await testTemplate('CSV Format', csvTemplate, csvJobDescription, baseURL);

  console.log('\nTemplate testing complete.');
}

async function testTemplate(name: string, template: string, jobDescription: any, baseURL: string) {
  try {
    const params = new URLSearchParams();
    params.append('requestJobDescription', JSON.stringify(jobDescription));
    params.append('template', template);

    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log(`${name}: Status ${response.status}`);
    console.log(`Response: ${responseText.substring(0, 100)}...`);
    
    if (responseText.includes('Authentication error')) {
      console.log('❌ Authentication failed');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('⚠️ Template not recognized');
    } else {
      console.log('✅ Template accepted');
    }
  } catch (error) {
    console.log(`${name}: Error - ${error}`);
  }
}

testExpensifyTemplateFormats().catch(console.error);