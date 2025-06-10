import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentRedirectPage() {
  const params = useParams();
  const clientSecret = params.clientSecret;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (!clientSecret) {
      setError("Invalid payment link");
      setLoading(false);
      return;
    }

    // Fetch payment details from backend
    fetch(`/api/payment-details/${clientSecret}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Payment not found');
        }
        return response.json();
      })
      .then(data => {
        setPaymentDetails(data);
        
        // If we have a Stripe payment link, redirect immediately
        if (data.stripePaymentUrl) {
          window.location.href = data.stripePaymentUrl;
          return;
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching payment details:', err);
        setError("This payment link is no longer valid or has expired");
        setLoading(false);
      });
  }, [clientSecret]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <CardTitle>Processing Payment Link</CardTitle>
            <CardDescription>
              Please wait while we redirect you to the secure payment page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Payment Link Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="text-center text-sm text-gray-600">
              <p>If you believe this is an error, please contact support or request a new payment link.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Ready</CardTitle>
          <CardDescription>
            Your secure payment link is ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${paymentDetails.amount}</span>
              </div>
              {paymentDetails.description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium">{paymentDetails.description}</span>
                </div>
              )}
            </div>
          )}
          
          {paymentDetails?.stripePaymentUrl && (
            <Button 
              onClick={() => window.location.href = paymentDetails.stripePaymentUrl}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Continue to Secure Payment
            </Button>
          )}
          
          <div className="text-center text-xs text-gray-500">
            <p>You will be redirected to Stripe's secure payment page</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}