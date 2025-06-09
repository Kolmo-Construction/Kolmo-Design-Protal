// Test script to directly test the professional email template with existing data
import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';

async function testProfessionalEmailDirectly() {
  console.log('🔍 Testing Professional Kolmo Email Template...\n');

  try {
    // 1. Get an existing quote that's already accepted (has a project)
    console.log('1. Finding existing project...');
    const projects = await storage.projects.getAllProjects();
    const project = projects.find(p => p.customerEmail && p.customerName);
    
    if (!project) {
      console.log('❌ No project with customer details found');
      return;
    }
    
    console.log(`✅ Using project: "${project.name}" for customer ${project.customerName}`);
    console.log(`   Customer email: ${project.customerEmail}`);
    
    // 2. Test the professional welcome email directly
    console.log('\n2. Sending professional Kolmo welcome email...');
    
    await paymentService.sendProjectWelcomeEmail(project.id);
    
    console.log('✅ Professional welcome email sent successfully!');
    
    console.log('\n📧 Email Features (Kolmo Branding):');
    console.log('  • Professional header with KOLMO logo');
    console.log('  • Color scheme: #3d4552 (dark blue/gray), #4a6670 (blue-gray), #db973c (golden orange)');
    console.log('  • Clean payment confirmation table with project details');
    console.log('  • Professional "What Happens Next" section with bullet points');
    console.log('  • Golden gradient project dashboard access card');
    console.log('  • Branded footer with Kolmo Construction branding');
    console.log('  • Professional typography and spacing');
    
    console.log(`\n✅ Customer "${project.customerName}" should receive the professional email at: ${project.customerEmail}`);
    console.log('\nThis demonstrates the new Kolmo-branded email template for payment confirmations.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfessionalEmailDirectly().catch(console.error);