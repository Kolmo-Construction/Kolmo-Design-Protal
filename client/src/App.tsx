import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/ProjectDetails";
import ProjectManagement from "@/pages/ProjectManagement";
import ProjectGeneration from "@/pages/project-generation";
import Documents from "@/pages/documents";
import Financials from "@/pages/financials";
import Messages from "@/pages/messages";
import ProgressUpdates from "@/pages/progress-updates";
import Schedule from "@/pages/schedule";
import Selections from "@/pages/selections";
import Settings from "@/pages/settings";
import SetupProfile from "@/pages/setup-profile";
import UserManagement from "@/pages/UserManagement";
import DevTools from "@/pages/dev-tools";
import Quotes from "@/pages/quotes";
import CustomerQuote from "@/pages/customer-quote";
import QuotePaymentPage from "@/pages/quote-payment";
import PaymentPage from "@/pages/PaymentPage";
import InvoiceDetailPage from "@/pages/InvoiceDetailPage";

import { ChatProvider } from "@/contexts/ChatContext";

function Router() {
  return (
    <Switch>
      <Route path="/setup-profile" component={SetupProfile} />
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetails} />
      <Route path="/project-generation/:projectId" component={ProjectGeneration} />
      <Route path="/project-management" component={ProjectManagement} />
      <Route path="/documents" component={Documents} />
      <Route path="/financials" component={Financials} />
      <Route path="/messages" component={Messages} />
      <Route path="/progress-updates" component={ProgressUpdates} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/selections" component={Selections} />
      <Route path="/quotes" component={Quotes} />
      <Route path="/invoices/:invoiceId/view" component={InvoiceDetailPage} />
      <Route path="/settings" component={Settings} />
      <Route path="/user-management" component={UserManagement} />
      
      {/* Public customer quote routes */}
      <Route path="/quote/:token" component={CustomerQuote} />
      <Route path="/customer/quote/:token" component={CustomerQuote} />
      <Route path="/quote-payment/:id" component={QuotePaymentPage} />
      
      {/* Public payment route */}
      <Route path="/payment/:clientSecret" component={PaymentPage} />

      {/* Development-only routes */}
      {import.meta.env.DEV && (
        <Route path="/dev-tools">
          {() => <DevTools />}
        </Route>
      )}
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        {/* <ChatProvider> */}
          <Toaster />
          <Router />
        {/* </ChatProvider> */}
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
