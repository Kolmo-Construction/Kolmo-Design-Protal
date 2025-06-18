/**
 * Test different Expensify API methods and endpoints
 */

async function testExpensifyAPIMethods() {
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  const baseURL = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';

  console.log('Testing different Expensify API approaches...\n');

  // Test 1: Export method
  console.log('1. Testing export method...');
  const exportJob = {
    type: 'export',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    filters: {
      reportState: 'APPROVED',
      startDate: '2024-01-01',
      endDate: '2025-06-18'
    }
  };
  await testAPICall('Export Method', exportJob, baseURL);

  // Test 2: Download method
  console.log('\n2. Testing download method...');
  const downloadJob = {
    type: 'download',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    fileName: 'expenses.csv'
  };
  await testAPICall('Download Method', downloadJob, baseURL);

  // Test 3: Simple data request
  console.log('\n3. Testing simple data request...');
  const simpleJob = {
    type: 'get',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    dataType: 'expenses'
  };
  await testAPICall('Simple Get', simpleJob, baseURL);

  // Test 4: Report export
  console.log('\n4. Testing report export...');
  const reportJob = {
    type: 'reportExport',
    credentials: {
      partnerUserID,
      partnerUserSecret,
    },
    reportIDList: []
  };
  await testAPICall('Report Export', reportJob, baseURL);

  // Test 5: Alternative parameter structure
  console.log('\n5. Testing alternative parameter structure...');
  const params = new URLSearchParams();
  params.append('partnerUserID', partnerUserID);
  params.append('partnerUserSecret', partnerUserSecret);
  params.append('type', 'export');
  params.append('reportState', 'APPROVED');
  
  try {
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    
    const responseText = await response.text();
    console.log(`Alternative Structure: Status ${response.status}`);
    console.log(`Response: ${responseText.substring(0, 150)}...`);
  } catch (error) {
    console.log(`Alternative Structure: Error - ${error}`);
  }

  console.log('\nAPI method testing complete.');
}

async function testAPICall(name: string, jobDescription: any, baseURL: string) {
  try {
    const params = new URLSearchParams();
    params.append('requestJobDescription', JSON.stringify(jobDescription));

    const response = await fetch(baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log(`${name}: Status ${response.status}`);
    console.log(`Response: ${responseText.substring(0, 150)}...`);
    
    if (responseText.includes('Authentication error')) {
      console.log('❌ Authentication failed');
    } else if (responseText.includes('No Template Submitted')) {
      console.log('⚠️ Needs template');
    } else if (responseText.includes('missing') || responseText.includes('malformed')) {
      console.log('⚠️ Parameter issue');
    } else if (response.status === 200) {
      console.log('✅ Request accepted');
    }
  } catch (error) {
    console.log(`${name}: Error - ${error}`);
  }
}

testExpensifyAPIMethods().catch(console.error);