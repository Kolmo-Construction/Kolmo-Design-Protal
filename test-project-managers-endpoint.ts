/**
 * Test script to verify the /api/project-managers endpoint is working correctly
 */

import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testProjectManagersEndpoint() {
  try {
    console.log('Testing project managers endpoint...');

    // First, verify we can fetch project managers from the database directly
    const projectManagers = await db.query.users.findMany({
      where: eq(users.role, 'projectManager'),
      orderBy: [users.lastName, users.firstName]
    });

    console.log('Project managers found in database:', projectManagers.length);
    projectManagers.forEach(pm => {
      console.log(`- ${pm.firstName} ${pm.lastName} (${pm.email})`);
    });

    // Test the API endpoint by making an authenticated request
    const response = await fetch('http://localhost:5000/api/project-managers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, we'd need to include session cookies for authentication
      }
    });

    console.log('API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response data:', data);
    } else {
      const error = await response.text();
      console.log('API Response error:', error);
    }

  } catch (error) {
    console.error('Error testing project managers endpoint:', error);
  }
}

testProjectManagersEndpoint();