/**
 * Debug script to test project 62 expense fetching with new tag format
 */

import { expensifyService } from './server/services/expensify.service';
import { storage } from './server/storage';

async function debugProject62Expenses() {
  console.log('=== PROJECT 62 EXPENSE DEBUG ===\n');
  
  // Step 1: Get project 62 details
  console.log('1. Getting project 62 details...');
  try {
    const project = await storage.projects.getProjectById(62);
    if (!project) {
      console.log('❌ Project 62 not found');
      return;
    }
    
    console.log(`   Project Name: ${project.name}`);
    console.log(`   Customer: ${project.customerName}`);
    console.log(`   Created: ${project.createdAt}`);
    console.log(`   Budget: $${project.totalBudget}`);
    
    // Step 2: Generate expected tag
    const expectedTag = expensifyService.generateProjectTag(
      project.customerName || 'Unknown',
      new Date(project.createdAt)
    );
    console.log(`   Expected Expensify Tag: ${expectedTag}`);
    
  } catch (error) {
    console.log('❌ Error getting project details:', error);
    return;
  }
  
  // Step 3: Test Expensify configuration
  console.log('\n2. Testing Expensify configuration...');
  const isConfigured = expensifyService.isConfigured();
  console.log(`   Configured: ${isConfigured ? 'YES' : 'NO'}`);
  
  if (!isConfigured) {
    console.log('❌ Expensify not configured - cannot fetch expenses');
    return;
  }
  
  // Step 4: Test connection
  console.log('\n3. Testing Expensify connection...');
  try {
    const connectionTest = await expensifyService.testConnection();
    console.log(`   Connected: ${connectionTest.connected ? 'YES' : 'NO'}`);
    console.log(`   Message: ${connectionTest.message}`);
    
    if (!connectionTest.connected) {
      console.log('❌ Connection failed - cannot fetch expenses');
      return;
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error);
    return;
  }
  
  // Step 5: Fetch all expenses and look for project 62 matches
  console.log('\n4. Fetching all expenses from Expensify...');
  try {
    const allExpenses = await expensifyService.getAllExpenses();
    console.log(`   Total expenses retrieved: ${allExpenses.length}`);
    
    // Look for expenses that match project 62
    const project62Expenses = allExpenses.filter(expense => {
      return expense.projectId === 62 || expense.tag === 'SarahJohnson_2025-06-15';
    });
    
    console.log(`   Expenses matching project 62: ${project62Expenses.length}`);
    
    if (project62Expenses.length > 0) {
      console.log('\n   Project 62 expenses found:');
      project62Expenses.forEach((expense, index) => {
        console.log(`   ${index + 1}. ${expense.description}`);
        console.log(`      Amount: $${expense.amount}`);
        console.log(`      Tag: ${expense.tag}`);
        console.log(`      Date: ${expense.date}`);
        console.log(`      Merchant: ${expense.merchant}`);
        console.log(`      Status: ${expense.status}`);
        console.log('');
      });
    } else {
      console.log('\n   No expenses found for project 62');
      
      // Show all tags for debugging
      console.log('\n   All tags found in expenses:');
      const uniqueTags = [...new Set(allExpenses.map(e => e.tag).filter(Boolean))];
      uniqueTags.forEach(tag => {
        console.log(`   - ${tag}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error fetching expenses:', error);
  }
  
  // Step 6: Test the budget tracking endpoint
  console.log('\n5. Testing budget tracking for project 62...');
  try {
    const projects = await storage.projects.getAllProjects();
    const project62 = projects.find(p => p.id === 62);
    
    if (project62) {
      const allExpenses = await expensifyService.getAllExpenses();
      const expectedTag = expensifyService.generateProjectTag(
        project62.customerName || 'Unknown',
        new Date(project62.createdAt)
      );
      
      const matchingExpenses = allExpenses.filter(expense => {
        return expense.projectId === project62.id || expense.tag === expectedTag;
      });
      
      const totalExpenses = matchingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalBudget = Number(project62.totalBudget);
      const remainingBudget = totalBudget - totalExpenses;
      const utilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
      
      console.log(`   Budget: $${totalBudget.toFixed(2)}`);
      console.log(`   Expenses: $${totalExpenses.toFixed(2)}`);
      console.log(`   Remaining: $${remainingBudget.toFixed(2)}`);
      console.log(`   Utilization: ${utilization.toFixed(1)}%`);
      console.log(`   Matching expenses: ${matchingExpenses.length}`);
    }
    
  } catch (error) {
    console.log('❌ Error testing budget tracking:', error);
  }
  
  console.log('\n=== DEBUG COMPLETE ===');
}

// Run the debug script
debugProject62Expenses().catch(console.error);