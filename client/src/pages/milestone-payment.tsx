import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { PaymentForm } from '@/components/payment/PaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PaymentDetails {
  invoice: {
    id: number;
    invoiceNumber: string;
    amount: string;
    description: string;
    customerName: string;
    customerEmail: string;
    dueDate: string;
  };
  project: {
    id: number;
    name: string;
  };
  clientSecret: string;
}

export default function MilestonePaymentPage() {
  const [, params] = useRoute('/payment/:clientSecret');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientSecret = params?.clientSecret;

  useEffect(() => {
    if (clientSecret) {
      loadPaymentDetails();
    }
  }, [clientSecret]);

  const loadPaymentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payment/details/${clientSecret}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Payment link not found or has expired');
          return;
        }
        throw new Error('Failed to load payment details');
      }
      
      const data = await response.json();
      setPaymentDetails(data);
    } catch (error) {
      console.error('Error loading payment details:', error);
      setError('Failed to load payment information. Please check the link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Confirm payment success with backend
      const response = await fetch('/api/payment/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      setPaymentCompleted(true);
      toast({
        title: "Payment Successful!",
        description: "Your milestone payment has been processed successfully.",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue confirming your payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <CardTitle>Loading Payment Details...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your milestone payment has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {paymentDetails && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-medium">Invoice #{paymentDetails.invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-600">{paymentDetails.project.name}</p>
                <p className="text-lg font-bold text-green-600">
                  ${parseFloat(paymentDetails.invoice.amount).toFixed(2)} Paid
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-2">What happens next:</p>
              <ul className="text-sm space-y-1 text-left">
                <li>• You'll receive a payment confirmation email shortly</li>
                <li>• Your project team will be notified of the payment</li>
                <li>• Work will continue according to your project schedule</li>
                <li>• You'll receive regular progress updates</li>
              </ul>
            </div>
            <Button onClick={() => setLocation('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Payment Not Found</CardTitle>
            <CardDescription>
              This payment link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Milestone Payment</h1>
          <p className="text-gray-600">Complete your payment to continue project progress</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice #</span>
                <span className="font-medium">{paymentDetails.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project</span>
                <span className="font-medium">{paymentDetails.project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Description</span>
                <span className="font-medium text-right">{paymentDetails.invoice.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date</span>
                <span className="font-medium">
                  {new Date(paymentDetails.invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-blue-600">
                  ${parseFloat(paymentDetails.invoice.amount).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
              <CardDescription>
                Enter your card details to complete the payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: paymentDetails.clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2563eb',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={paymentDetails.clientSecret}
                  amount={parseFloat(paymentDetails.invoice.amount)}
                  description={paymentDetails.invoice.description}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}