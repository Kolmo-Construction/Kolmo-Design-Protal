import React from 'react';
import { AdminQuoteChatWidget } from './client/src/components/chat/QuoteChatWidget';

// Simple test component to debug chat widget
export function DebugChat() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Chat Widget Debug</h1>
      <AdminQuoteChatWidget 
        quoteId="6"
        quoteNumber="KOL-2025-343316"
      />
    </div>
  );
}

console.log('Chat widget module loaded');