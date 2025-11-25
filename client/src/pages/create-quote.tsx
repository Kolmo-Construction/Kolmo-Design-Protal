import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, User, FileText, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { theme } from "@/config/theme";

const createQuoteSchema = z.object({
  title: z.string().min(1, "Quote title is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  projectType: z.string().min(1, "Project type is required"),
  location: z.string().optional(),
  description: z.string().optional(),
});

type CreateQuoteFormData = z.infer<typeof createQuoteSchema>;

const steps = [
  { id: 1, title: "Customer Info", icon: User },
  { id: 2, title: "Project Details", icon: FileText },
  { id: 3, title: "Review & Create", icon: Check },
];

export default function CreateQuotePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateQuoteFormData>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      title: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      projectType: "",
      location: "",
      description: "",
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: CreateQuoteFormData) => {
      const response = await apiRequest("POST", "/api/quotes", {
        ...data,
        subtotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        taxRate: 8.5,
        taxAmount: 0,
        total: 0,
        downPaymentPercentage: 40,
        milestonePaymentPercentage: 40,
        finalPaymentPercentage: 20,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [],
      });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Quote Created!",
        description: `Quote ${data.quoteNumber} created successfully. You can now add line items.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      navigate("/quotes");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
    },
  });

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof CreateQuoteFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["customerName", "customerEmail"];
    } else if (step === 2) {
      fieldsToValidate = ["title", "projectType"];
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CreateQuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const formValues = form.watch();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.surfaceLight }}>
      {/* Header */}
      <div style={{ backgroundColor: theme.colors.primary }} className="py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/quotes")}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Button>
          <h1 className="text-2xl font-bold text-white">Create New Quote</h1>
          <p className="text-gray-200">Follow the steps to create a new quote</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        currentStep >= step.id
                          ? "text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                      style={{
                        backgroundColor: currentStep >= step.id ? theme.colors.accent : undefined,
                      }}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className="text-xs mt-2 font-medium hidden sm:block"
                      style={{ color: currentStep >= step.id ? theme.colors.primary : theme.colors.textMuted }}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="w-16 sm:w-24 h-1 mx-2"
                      style={{
                        backgroundColor: currentStep > step.id ? theme.colors.accent : theme.colors.border,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Customer Info */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.primary }}>
                    Customer Information
                  </CardTitle>
                  <CardDescription>
                    Enter the customer's contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Smith"
                            {...field}
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                            data-testid="input-customer-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(555) 123-4567"
                            {...field}
                            data-testid="input-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, City, State"
                            {...field}
                            data-testid="input-customer-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.primary }}>
                    Project Details
                  </CardTitle>
                  <CardDescription>
                    Describe the project you're quoting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Kitchen Renovation"
                            {...field}
                            data-testid="input-quote-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Residential, Commercial, Remodel"
                            {...field}
                            data-testid="input-project-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Backyard, Kitchen, Bathroom"
                            {...field}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any details about the project scope, special requirements, or notes..."
                            className="min-h-24"
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.primary }}>
                    Review & Create
                  </CardTitle>
                  <CardDescription>
                    Review the quote details before creating
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer Summary */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: theme.colors.surfaceLight }}
                  >
                    <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                      <User className="h-4 w-4 mr-2" />
                      Customer
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Name:</span>
                        <p className="font-medium">{formValues.customerName || "-"}</p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Email:</span>
                        <p className="font-medium">{formValues.customerEmail || "-"}</p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Phone:</span>
                        <p className="font-medium">{formValues.customerPhone || "-"}</p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Address:</span>
                        <p className="font-medium">{formValues.customerAddress || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Project Summary */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: theme.colors.surfaceLight }}
                  >
                    <h3 className="font-semibold mb-3 flex items-center" style={{ color: theme.colors.primary }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Project
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Title:</span>
                        <p className="font-medium">{formValues.title || "-"}</p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Type:</span>
                        <p className="font-medium">{formValues.projectType || "-"}</p>
                      </div>
                      <div>
                        <span style={{ color: theme.colors.textMuted }}>Location:</span>
                        <p className="font-medium">{formValues.location || "-"}</p>
                      </div>
                    </div>
                    {formValues.description && (
                      <div className="mt-3">
                        <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                          Description:
                        </span>
                        <p className="text-sm font-medium mt-1">{formValues.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Next Steps Info */}
                  <div
                    className="p-4 rounded-lg border-l-4"
                    style={{ 
                      backgroundColor: theme.getColorWithOpacity(theme.colors.accent, 0.1),
                      borderLeftColor: theme.colors.accent 
                    }}
                  >
                    <h3 className="font-semibold mb-2" style={{ color: theme.colors.accent }}>
                      What happens next?
                    </h3>
                    <ul className="text-sm space-y-1" style={{ color: theme.colors.textDark }}>
                      <li>• Quote will be created as a draft</li>
                      <li>• You can add line items with pricing</li>
                      <li>• Send it to the customer when ready</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{ borderColor: theme.colors.secondary, color: theme.colors.secondary }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="text-white"
                  style={{ backgroundColor: theme.colors.accent }}
                  data-testid="button-next-step"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createQuoteMutation.isPending}
                  className="text-white"
                  style={{ backgroundColor: theme.colors.accent }}
                  data-testid="button-create-quote"
                >
                  {createQuoteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Quote
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
