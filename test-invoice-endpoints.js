// Run this in browser console to test invoice endpoints
(async function testInvoiceEndpoints() {
  console.log('Testing invoice endpoints with browser session...');
  
  try {
    // First test getting invoices for the project
    console.log('1. Testing GET /api/projects/33/invoices...');
    const invoicesResponse = await fetch('/api/projects/33/invoices', {
      credentials: 'include'
    });
    console.log('Invoices response status:', invoicesResponse.status);
    
    if (invoicesResponse.ok) {
      const invoices = await invoicesResponse.json();
      console.log('Invoices:', invoices);
      
      if (invoices.length > 0) {
        const testInvoice = invoices[0];
        console.log('Testing with invoice:', testInvoice.id);
        
        // Test view endpoint
        console.log('2. Testing GET view endpoint...');
        const viewResponse = await fetch(`/api/projects/33/invoices/${testInvoice.id}/view`, {
          credentials: 'include'
        });
        console.log('View response status:', viewResponse.status);
        
        if (viewResponse.ok) {
          const viewData = await viewResponse.json();
          console.log('View data:', viewData);
        } else {
          const viewError = await viewResponse.text();
          console.log('View error:', viewError);
        }
        
        // Test download endpoint
        console.log('3. Testing GET download endpoint...');
        const downloadResponse = await fetch(`/api/projects/33/invoices/${testInvoice.id}/download`, {
          credentials: 'include'
        });
        console.log('Download response status:', downloadResponse.status);
        console.log('Download response headers:', Object.fromEntries(downloadResponse.headers.entries()));
        
        if (!downloadResponse.ok) {
          const downloadError = await downloadResponse.text();
          console.log('Download error:', downloadError);
        } else {
          console.log('Download successful - PDF size:', downloadResponse.headers.get('content-length'));
        }
      }
    } else {
      const error = await invoicesResponse.text();
      console.log('Invoices error:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
})();