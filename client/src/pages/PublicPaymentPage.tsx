import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, AlertTriangle } from 'lucide-react';

// Ensure your Stripe publishable key is in your .env file
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentIntentDetails {
  amount: number;
  currency: string;
  description: string;
}

export default function PublicPaymentPage() {
  const { clientSecret } = useParams<{ clientSecret: string }>();
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (clientSecret) {
      const id = clientSecret.split('_secret_')[0];
      setPaymentIntentId(id);
    }
  }, [clientSecret]);

  const { data: paymentDetails, isLoading, error } = useQuery<PaymentIntentDetails>({
    queryKey: [`/api/payment-intent/${paymentIntentId}`],
    queryFn: () => apiRequest('GET', `/api/payment-intent/${paymentIntentId}`).then(res => res.json()),
    enabled: !!paymentIntentId,
  });

  if (isLoading || !paymentIntentId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Loading Payment Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Payment</h2>
        <p className="text-red-600">This payment link may be invalid or expired.</p>
      </div>
    );
  }

  if (!clientSecret || !paymentDetails) {
     return <div>Error: Invalid payment details.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
                clientSecret={clientSecret}
                amount={paymentDetails.amount / 100} // Stripe amount is in cents
                description={paymentDetails.description}
                onSuccess={() => {
                    window.location.href = '/payment-success'; // Redirect on success
                }}
            />
        </Elements>
    </div>
  );
}