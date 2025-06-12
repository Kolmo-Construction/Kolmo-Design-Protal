import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth-unified';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  User,
  Calendar
} from 'lucide-react';
import { ClientNavigation } from '@/components/ClientNavigation';

interface Message {
  id: number;
  content: string;
  senderName: string;
  senderRole: string;
  timestamp: string;
  projectName: string;
  isRead: boolean;
}

export default function ClientMessages() {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = React.useState('');

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/client/messages'],
    enabled: !!user && user.role === 'client'
  });

  const { data: projects } = useQuery<any[]>({
    queryKey: ['/api/client/dashboard'],
    enabled: !!user && user.role === 'client',
    select: (data: any) => data?.projects || []
  });

  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <ClientNavigation />
        <div className="container mx-auto px-6 pt-24">
          <Card className="max-w-md mx-auto border-destructive/20">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">This page is for client users only.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      // Send message API call would go here
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ClientNavigation />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Project Messages</h1>
          <p className="text-muted-foreground">
            Communicate with your project team and stay updated on progress.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-2">
            <Card className="border-accent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="border border-muted rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-accent/10 rounded-full p-2">
                              <User className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <div className="font-medium">{message.senderName}</div>
                              <div className="text-sm text-muted-foreground">
                                {message.senderRole === 'admin' ? 'Project Manager' : 'Team Member'}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(message.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <Badge variant="outline" className="text-xs">
                            {message.projectName}
                          </Badge>
                        </div>
                        
                        <p className="text-foreground">{message.content}</p>
                        
                        {!message.isRead && (
                          <div className="mt-2">
                            <Badge className="bg-accent text-white">New</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Messages from your project team will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Send Message Form */}
          <div>
            <Card className="border-accent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Send Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your message to the project team..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  Your message will be sent to your project manager and team members.
                </div>
              </CardContent>
            </Card>

            {/* Project Quick Access */}
            {projects && projects.length > 0 && (
              <Card className="border-accent/20 shadow-lg mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Your Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{project.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}