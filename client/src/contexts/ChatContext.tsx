import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatContextType {
  client: StreamChat | null;
  isConnected: boolean;
  currentChannel: StreamChannel | null;
  setCurrentChannel: (channel: StreamChannel | null) => void;
  initializeCustomerChat: (quoteToken: string, customerName: string, customerEmail: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  joinQuoteChannel: (quoteId: string) => Promise<StreamChannel | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  isCustomer?: boolean;
  quoteToken?: string;
  customerName?: string;
  customerEmail?: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  isCustomer = false,
  quoteToken,
  customerName,
  customerEmail
}) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<StreamChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Query for admin chat token
  const { data: adminChatData, error: adminError } = useQuery({
    queryKey: ['/api/chat/token'],
    enabled: !isCustomer,
    retry: 2,
  });

  // Initialize admin chat
  useEffect(() => {
    if (!isCustomer && adminChatData && !client) {
      initializeAdminChat(adminChatData);
    }
  }, [isCustomer, adminChatData, client]);

  const initializeAdminChat = async (chatData: any) => {
    if (isLoading || client) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const chatClient = StreamChat.getInstance(chatData.apiKey);
      await chatClient.connectUser(
        { 
          id: chatData.userId,
          name: chatData.userName || 'Admin User',
        },
        chatData.token
      );
      setClient(chatClient);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize admin chat';
      setError(errorMessage);
      console.error('Error initializing admin chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCustomerChat = async (token: string, name: string, email: string) => {
    if (isLoading || client) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('/api/chat/customer-token', 'POST', {
        quoteToken: token,
        customerName: name,
        customerEmail: email,
      }) as any;

      const chatClient = StreamChat.getInstance(response.apiKey);
      await chatClient.connectUser(
        { 
          id: response.userId,
          name: name,
        },
        response.token
      );

      setClient(chatClient);
      setIsConnected(true);

      // Join the quote channel
      const channel = chatClient.channel('messaging', response.channelId);
      await channel.watch();
      setCurrentChannel(channel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize customer chat';
      setError(errorMessage);
      console.error('Error initializing customer chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const joinQuoteChannel = async (quoteId: string): Promise<StreamChannel | null> => {
    if (!client) return null;
    
    try {
      const channelId = `quote-${quoteId}`;
      const channel = client.channel('messaging', channelId);
      await channel.watch();
      return channel;
    } catch (err) {
      console.error('Error joining quote channel:', err);
      return null;
    }
  };

  // Auto-initialize customer chat if props are provided
  useEffect(() => {
    if (isCustomer && quoteToken && customerName && customerEmail && !client) {
      initializeCustomerChat(quoteToken, customerName, customerEmail);
    }
  }, [isCustomer, quoteToken, customerName, customerEmail, client]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [client]);

  const value: ChatContextType = {
    client,
    isConnected,
    currentChannel,
    setCurrentChannel,
    initializeCustomerChat,
    error,
    isLoading,
    joinQuoteChannel,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};