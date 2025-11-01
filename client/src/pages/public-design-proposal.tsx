import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DesignProposalWithComparisons } from "@shared/schema";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { 
  Phone, 
  Mail, 
  Shield, 
  Award, 
  Star, 
  Paintbrush,
  ArrowLeftRight,
  Check,
  Sparkles
} from "lucide-react";
import kolmoLogo from "@assets/kolmo-logo (1).png";

export default function PublicDesignProposalPage() {
  const [, params] = useRoute("/design-proposal/:token");
  const token = params?.token;

  const { data: proposal, isLoading, error } =
    useQuery<DesignProposalWithComparisons>({
      queryKey: [`/api/design-proposals/public/${token}`],
      enabled: !!token,
    });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#f5f5f5'}}>
        <Card className="max-w-md shadow-xl">
          <CardHeader>
            <CardTitle style={{color: '#3d4552'}}>Invalid Link</CardTitle>
            <CardDescription>
              The design proposal link is invalid or missing.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#f5f5f5'}}>
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="space-y-8">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#f5f5f5'}}>
        <Card className="max-w-md shadow-xl">
          <CardHeader>
            <CardTitle style={{color: '#3d4552'}}>Proposal Not Found</CardTitle>
            <CardDescription>
              The design proposal you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f5f5f5'}}>
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <img src={kolmoLogo} alt="Kolmo Construction" className="h-12 w-12 object-contain" data-testid="img-kolmo-logo" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold" style={{color: '#3d4552'}}>Kolmo Construction</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm mt-1" style={{color: '#4a6670'}}>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" style={{color: '#db973c'}} />
                    <span>Licensed & Insured</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" style={{color: '#db973c'}} />
                    <span>EPA Certified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" style={{color: '#db973c'}} />
                    <span>Seattle's Premier Builder</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <div className="flex flex-col sm:items-end gap-2">
                <a 
                  href="tel:+12064105100" 
                  className="flex items-center gap-2 transition-colors" 
                  style={{color: '#4a6670'}} 
                  onMouseEnter={e => e.currentTarget.style.color = '#db973c'} 
                  onMouseLeave={e => e.currentTarget.style.color = '#4a6670'}
                  data-testid="link-phone"
                >
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold">(206) 410-5100</span>
                </a>
                <a 
                  href="mailto:projects@kolmo.io" 
                  className="flex items-center gap-2 transition-colors" 
                  style={{color: '#4a6670'}} 
                  onMouseEnter={e => e.currentTarget.style.color = '#db973c'} 
                  onMouseLeave={e => e.currentTarget.style.color = '#4a6670'}
                  data-testid="link-email"
                >
                  <Mail className="h-4 w-4" />
                  <span>projects@kolmo.io</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-white py-16" style={{backgroundColor: '#3d4552'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6" style={{backgroundColor: 'rgba(219, 151, 60, 0.15)'}}>
            <Sparkles className="h-5 w-5" style={{color: '#db973c'}} />
            <span className="text-sm font-medium" style={{color: '#db973c'}}>Your Design Proposal</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 animate-fadeIn" data-testid="text-proposal-title">
            {proposal.title}
          </h1>
          
          {proposal.description && (
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-6 animate-fadeIn animation-delay-200" data-testid="text-proposal-description">
              {proposal.description}
            </p>
          )}
          
          {proposal.customerName && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg animate-fadeIn animation-delay-300" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)'}}>
              <Paintbrush className="h-5 w-5" style={{color: '#db973c'}} />
              <span className="font-medium" data-testid="text-customer-name">
                Prepared for {proposal.customerName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {proposal.comparisons && proposal.comparisons.length > 0 ? (
          <div className="space-y-12">
            {/* Section Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4" style={{backgroundColor: 'rgba(219, 151, 60, 0.1)'}}>
                <ArrowLeftRight className="h-5 w-5" style={{color: '#db973c'}} />
                <span className="text-sm font-medium" style={{color: '#db973c'}}>
                  Before & After Transformations
                </span>
              </div>
              <h2 className="text-3xl font-bold" style={{color: '#3d4552'}}>
                See the Difference
              </h2>
              <p className="text-lg mt-2" style={{color: '#4a6670'}}>
                Drag the slider to compare our proposed design changes
              </p>
            </div>

            {/* Comparison Cards */}
            {proposal.comparisons.map((comparison, index) => (
              <div 
                key={comparison.id} 
                className="animate-fadeIn" 
                style={{animationDelay: `${index * 100}ms`, animationFillMode: 'both'}}
                data-testid={`card-comparison-${index}`}
              >
                <Card className="overflow-hidden shadow-lg border-2 hover:shadow-xl transition-shadow" style={{borderColor: '#e5e5e5'}}>
                  <CardHeader className="bg-white" style={{borderBottom: '2px solid #f5f5f5'}}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2" style={{color: '#3d4552'}} data-testid={`text-comparison-title-${index}`}>
                          {comparison.title}
                        </CardTitle>
                        {comparison.description && (
                          <CardDescription className="text-base" style={{color: '#4a6670'}} data-testid={`text-comparison-description-${index}`}>
                            {comparison.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className="text-xs font-semibold shrink-0" style={{backgroundColor: '#db973c', color: 'white'}}>
                        Comparison {index + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative" style={{backgroundColor: '#f5f5f5'}}>
                      <ReactCompareSlider
                        itemOne={
                          <ReactCompareSliderImage
                            src={comparison.beforeImageUrl}
                            alt="Before"
                            style={{ 
                              objectFit: 'contain', 
                              width: '100%', 
                              height: '100%',
                              maxHeight: 'none',
                              display: 'block'
                            }}
                          />
                        }
                        itemTwo={
                          <ReactCompareSliderImage
                            src={comparison.afterImageUrl}
                            alt="After"
                            style={{ 
                              objectFit: 'contain', 
                              width: '100%', 
                              height: '100%',
                              maxHeight: 'none',
                              display: 'block'
                            }}
                          />
                        }
                        position={50}
                        style={{
                          height: "600px",
                          width: "100%",
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center px-6 py-4 bg-white" style={{borderTop: '2px solid #f5f5f5'}}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#4a6670'}}></div>
                        <span className="text-sm font-semibold" style={{color: '#3d4552'}}>BEFORE</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{color: '#4a6670'}}>
                        <ArrowLeftRight className="h-4 w-4" />
                        <span>Drag to compare</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{color: '#3d4552'}}>AFTER</span>
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#db973c'}}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <Paintbrush className="h-16 w-16 mx-auto mb-4" style={{color: '#4a6670', opacity: 0.5}} />
              <p className="text-lg" style={{color: '#4a6670'}}>
                No design comparisons available at this time.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="rounded-2xl shadow-lg text-white p-8 mt-12" style={{backgroundColor: '#4a6670'}}>
          <div className="text-center">
            <Check className="h-12 w-12 mx-auto mb-4" style={{color: '#db973c'}} />
            <h3 className="text-2xl font-bold mb-2">Ready to Transform Your Space?</h3>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              We're excited to bring your vision to life with our expert craftsmanship. 
              Contact us to discuss this proposal and next steps.
            </p>
            <Separator className="my-6" style={{backgroundColor: 'rgba(255,255,255,0.2)'}} />
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="tel:+12064105100" 
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                style={{backgroundColor: '#db973c', color: 'white'}}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c8863a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#db973c'}
                data-testid="button-call"
              >
                <Phone className="h-5 w-5" />
                Call Us: (206) 410-5100
              </a>
              <a 
                href="mailto:projects@kolmo.io" 
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all border-2"
                style={{backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)'}}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                data-testid="button-email"
              >
                <Mail className="h-5 w-5" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div className="text-white mt-12" style={{backgroundColor: '#3d4552'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="rounded-lg p-3" style={{backgroundColor: '#4a6670'}}>
                <img src={kolmoLogo} alt="Kolmo Construction" className="h-12 w-12 object-contain" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold">Kolmo Construction</h3>
                <p style={{color: 'rgba(255,255,255,0.7)'}}>Building Excellence Since 2010</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="flex items-center justify-center gap-3" style={{color: 'rgba(255,255,255,0.7)'}}>
                <Shield className="h-6 w-6" style={{color: '#db973c'}} />
                <div>
                  <div className="font-semibold text-white">Licensed & Insured</div>
                  <div className="text-sm">WA State Contractor License</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3" style={{color: 'rgba(255,255,255,0.7)'}}>
                <Award className="h-6 w-6" style={{color: '#db973c'}} />
                <div>
                  <div className="font-semibold text-white">EPA Certified</div>
                  <div className="text-sm">Lead-Safe Work Practices</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3" style={{color: 'rgba(255,255,255,0.7)'}}>
                <Star className="h-6 w-6" style={{color: '#db973c'}} />
                <div>
                  <div className="font-semibold text-white">Trusted Locally</div>
                  <div className="text-sm">Pacific Northwest Experts</div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6" style={{borderColor: '#4a6670'}}>
              <p className="text-sm" style={{color: 'rgba(255,255,255,0.6)'}}>
                © 2024 Kolmo. All rights reserved. | 
                Professional home improvement services with over a decade of experience in the Pacific Northwest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
