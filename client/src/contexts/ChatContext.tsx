import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel } from 'stream-chat-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatContextType {
  client: StreamChat | null;
  isConnected: boolean;
  currentChannel: any;
  setCurrentChannel: (channel: any) => void;
  initializeCustomerChat: (quoteToken: string, customerName: string, customerEmail: string) => Promise<void>;
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
  children: React.ReactNode;
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
  const [currentChannel, setCurrentChannel] = useState<any>(null);

  // Query for admin chat token
  const { data: adminChatData } = useQuery({
    queryKey: ['/api/chat/token'],
    enabled: !isCustomer,
  });

  // Initialize admin chat
  useEffect(() => {
    if (!isCustomer && adminChatData) {
      initializeAdminChat(adminChatData);
    }
  }, [isCustomer, adminChatData]);

  const initializeAdminChat = async (chatData: any) => {
    try {
      const chatClient = StreamChat.getInstance(chatData.apiKey);
      await chatClient.connectUser(
        { id: chatData.userId },
        chatData.token
      );
      setClient(chatClient);
      setIsConnected(true);
    } catch (error) {
      console.error('Error initializing admin chat:', error);
    }
  };

  const initializeCustomerChat = async (token: string, name: string, email: string) => {
    try {
      const response = await apiRequest('/api/chat/customer-token', 'POST', {
        quoteToken: token,
        customerName: name,
        customerEmail: email,
      });

      const chatClient = StreamChat.getInstance(response.apiKey);
      await chatClient.connectUser(
        { 
          id: response.userId,
          name: name,
          email: email,
        },
        response.token
      );

      setClient(chatClient);
      setIsConnected(true);

      // Join the quote channel
      const channel = chatClient.channel('messaging', response.channelId);
      await channel.watch();
      setCurrentChannel(channel);
    } catch (error) {
      console.error('Error initializing customer chat:', error);
    }
  };

  // Auto-initialize customer chat if props are provided
  useEffect(() => {
    if (isCustomer && quoteToken && customerName && customerEmail) {
      initializeCustomerChat(quoteToken, customerName, customerEmail);
    }
  }, [isCustomer, quoteToken, customerName, customerEmail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [client]);

  const value: ChatContextType = {
    client,
    isConnected,
    currentChannel,
    setCurrentChannel,
    initializeCustomerChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};