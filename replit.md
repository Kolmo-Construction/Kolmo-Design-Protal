# Kolmo Construction Client Portal

## Overview
The Kolmo Construction Client Portal is a full-stack application designed to streamline project management, financial transactions (quotes, invoices), and client communications for Kolmo Construction. It offers a professional interface for both administrative staff and clients to track project progress, manage payments, and facilitate real-time communication, enhancing efficiency and client satisfaction.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend utilizes React 18 with TypeScript, built on Radix UI components and styled with Tailwind CSS v4. This combination ensures a modern, accessible, and highly customizable user interface. State management is handled by TanStack React Query, and forms are managed with React Hook Form and Zod validation.

### Technical Implementations
The backend is powered by Node.js 20 with Express.js, written in TypeScript. It features a RESTful API design with robust error handling. Authentication is managed via Passport.js, supporting both local and magic link strategies, with role-based access control. Session management uses Express sessions backed by a PostgreSQL store.

### Feature Specifications
- **Authentication**: Secure local and magic link authentication, role-based access (admin, client, projectManager), scrypt password hashing, PostgreSQL session persistence.
- **Payment Processing**: Integrated with Stripe for payment intents and webhook-based confirmations, handling quote acceptance, down payments, and automated email notifications via Mailgun.
- **Project Management**: Comprehensive project lifecycle tracking, client-project association, status management (draft, finalized, archived), file uploads, and punch list tracking.
- **Communication**: Real-time chat via Stream Chat, offering project-based channels with WebSocket connections.
- **Quote System**: Professional quote generation with line items, PDF generation, email delivery, and a workflow for acceptance that triggers project and invoice creation.
- **Budget Tracking**: Integration with Zoho Expense for comprehensive budget tracking, including OAuth 2.0 authentication and secure token management.

### System Design Choices
The primary database is PostgreSQL 16 (Neon serverless), utilizing Drizzle ORM for type-safe schema definitions and Drizzle Kit for migrations. Connection pooling is managed by `@neondatabase/serverless`. Data flow is structured from quote creation to project activation, client portal access, and payment processing, all secured and automated.

## External Dependencies

- **Email Service**: Mailgun for sending transactional emails (quotes, confirmations, magic links).
- **Payment Processing**: Stripe for handling all payment transactions, including payment intents, webhooks, and customer management.
- **Real-time Communication**: Stream Chat for in-app messaging and real-time communication between clients and project managers.
- **File Storage**: AWS S3 (optional, configurable) for secure file uploads, with a local storage fallback for development.
- **Budget Tracking**: Zoho Expense for integrating financial data and expense management.