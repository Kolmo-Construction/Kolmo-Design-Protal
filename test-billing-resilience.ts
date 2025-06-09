import { PaymentService } from './server/services/payment.service';
import { storage } from './server/storage';

async function testBillingResilience() {
  console.log('Testing billing system resilience...');
  
  const paymentService = new PaymentService();
  
  try {
    // Test project 25 - has a quote but we'll test the fallback mechanism
    console.log('Testing milestone billing for project with budget fallback...');
    
    // Get project details
    const project = await storage.projects.getProjectById(25);
    console.log('Project found:', {
      id: project?.id,
      name: project?.name,
      totalBudget: project?.totalBudget,
      originQuoteId: project?.originQuoteId
    });
    
    // Get milestone details
    const milestone = await storage.milestones.getMilestoneById(1);
    console.log('Milestone found:', {
      id: milestone?.id,
      title: milestone?.title,
      billingPercentage: milestone?.billingPercentage,
      isBillable: milestone?.isBillable
    });
    
    if (project && milestone) {
      // Test creating a draft invoice for the milestone
      console.log('Creating draft invoice for milestone...');
      
      const invoice = await paymentService.createDraftInvoiceForMilestone(
        project.id,
        milestone.id
      );
      
      console.log('Draft invoice created:', {
        id: invoice?.id,
        amount: invoice?.amount,
        description: invoice?.description,
        status: invoice?.status,
        projectId: invoice?.projectId,
        quoteId: invoice?.quoteId,
        milestoneId: invoice?.milestoneId
      });
    }
    
  } catch (error) {
    console.error('Error testing billing resilience:', error);
  }
}

testBillingResilience();