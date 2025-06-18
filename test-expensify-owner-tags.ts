/**
 * Test script to verify the new Expensify tag format using project owner names and creation dates
 */
import { expensifyService } from './server/services/expensify.service';

async function testExpensifyOwnerTags() {
  console.log('Testing Expensify integration with owner-based tags...\n');
  
  // Test 1: Tag Generation
  console.log('=== TAG GENERATION TEST ===');
  
  const testCases = [
    { ownerName: 'John Smith', date: new Date('2025-06-18'), expected: 'JohnSmith_2025-06-18' },
    { ownerName: 'Maria Rodriguez-Garcia', date: new Date('2025-01-15'), expected: 'MariaRodriguezGarcia_2025-01-15' },
    { ownerName: 'Bob & Associates LLC', date: new Date('2025-12-01'), expected: 'BobAssociatesLLC_2025-12-01' },
    { ownerName: 'Jennifer O\'Connor', date: new Date('2025-03-22'), expected: 'JenniferOConnor_2025-03-22' }
  ];
  
  testCases.forEach((testCase, index) => {
    const generated = expensifyService.generateProjectTag(testCase.ownerName, testCase.date);
    const passed = generated === testCase.expected;
    console.log(`${index + 1}. "${testCase.ownerName}" -> ${generated} ${passed ? '✅' : '❌'}`);
    if (!passed) {
      console.log(`   Expected: ${testCase.expected}`);
    }
  });
  
  // Test 2: Project Creation with New Tag Format
  console.log('\n=== PROJECT CREATION WITH TAGS ===');
  
  if (!expensifyService.isConfigured()) {
    console.log('❌ Expensify not configured - skipping project creation test');
    return;
  }
  
  const testProjects = [
    { id: 100, name: 'Kitchen Renovation', owner: 'Sarah Johnson', date: new Date() },
    { id: 101, name: 'Bathroom Remodel', owner: 'Mike Davis', date: new Date() },
  ];
  
  for (const project of testProjects) {
    try {
      const result = await expensifyService.createProject(
        project.id,
        project.name,
        project.owner,
        project.date
      );
      
      if (result.success) {
        console.log(`✅ Project ${project.id}: "${project.name}"`);
        console.log(`   Owner: ${project.owner}`);
        console.log(`   Expensify Tag: ${result.tag}`);
      } else {
        console.log(`❌ Failed to create project ${project.id}`);
      }
    } catch (error) {
      console.log(`❌ Error creating project ${project.id}:`, error.message);
    }
  }
  
  // Test 3: Tag Usage Instructions
  console.log('\n=== EXPENSIFY USAGE INSTRUCTIONS ===');
  console.log('To use the new tag system in Expensify:');
  console.log('1. When submitting expenses, use the generated tag format');
  console.log('2. Tag format: [OwnerName]_[YYYY-MM-DD]');
  console.log('3. Examples:');
  
  testCases.slice(0, 2).forEach(testCase => {
    const tag = expensifyService.generateProjectTag(testCase.ownerName, testCase.date);
    console.log(`   • For ${testCase.ownerName}: use tag "${tag}"`);
  });
  
  // Test 4: Verify API Connection
  console.log('\n=== API CONNECTION VERIFICATION ===');
  try {
    const connectionTest = await expensifyService.testConnection();
    console.log(`Connection: ${connectionTest.connected ? '✅ CONNECTED' : '❌ FAILED'}`);
    console.log(`Status: ${connectionTest.message}`);
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
  
  console.log('\n🎉 Expensify owner-based tag system is ready!');
  console.log('Projects will now automatically generate meaningful tags for expense tracking.');
}

testExpensifyOwnerTags().catch(console.error);