// server/services/notification.service.ts
import { storage } from '@server/storage/index';
import { MessageWithSender } from '@server/storage/types'; // Adjust path if needed
import { User, Project } from '@shared/schema';
import { sendNewMessageNotificationEmail, isEmailServiceConfigured } from '@server/email'; // Import email function
import { log as logger } from '@server/vite'; // Use the logger
import { generateProjectUrl } from '@server/domain.config';

/**
 * Sends email notifications for a newly created message.
 * Determines recipients based on message details.
 * Does not notify the sender.
 * @param message - The newly created message object with sender details.
 */
export async function sendNewMessageNotification(message: MessageWithSender): Promise<void> {
    if (!isEmailServiceConfigured()) {
        logger('[NotificationService] Email service not configured. Skipping notification.', 'Notification');
        return;
    }

    logger(`[NotificationService] Processing notification for message ID: ${message.id}`, 'Notification');

    const senderId = message.senderId;
    const recipients: User[] = [];

    try {
        // 1. Get Project Details (for name and members)
        const project = await storage.projects.getProjectById(message.projectId);
        if (!project) {
            logger(`[NotificationService] Project ID ${message.projectId} not found for message ${message.id}. Cannot send notifications.`, 'Notification');
            return;
        }

        const projectName = project.name;
        const senderName = `${message.sender.firstName} ${message.sender.lastName}`;

        // Construct the link to the project's messages tab
        const messageLink = generateProjectUrl(message.projectId, 'messages');

        // 2. Determine Recipients
        if (message.recipientId) {
            // Direct message: Notify only the recipient (if not the sender)
            if (message.recipientId !== senderId) {
                const recipientUser = await storage.users.getUserById(String(message.recipientId)); // getUserById expects string
                if (recipientUser) {
                    recipients.push(recipientUser);
                    logger(`[NotificationService] Direct message: Notifying recipient ID ${message.recipientId}`, 'Notification');
                } else {
                     logger(`[NotificationService] Recipient user ID ${message.recipientId} not found.`, 'Notification');
                }
            } else {
                 logger(`[NotificationService] Message recipient is the sender (ID ${senderId}). No notification sent.`, 'Notification');
            }
        } else {
            // Project-wide message: Notify PM and all clients (excluding sender)
            logger(`[NotificationService] Project-wide message: Determining recipients for project ${project.id}`, 'Notification');
            const potentialRecipientIds = new Set<number>();

            // Add Project Manager (if exists and not the sender)
            if (project.projectManagerId && project.projectManagerId !== senderId) {
                potentialRecipientIds.add(project.projectManagerId);
            }

            // Add Clients (if they exist and are not the sender)
            project.clients?.forEach(client => {
                if (client.id !== senderId) {
                    potentialRecipientIds.add(client.id);
                }
            });

            if (potentialRecipientIds.size > 0) {
                 logger(`[NotificationService] Potential recipient IDs: ${Array.from(potentialRecipientIds).join(', ')}`, 'Notification');
                 // Fetch user details for all potential recipients
                 // TODO: Implement a batch fetch method in UserRepository (getUserByIds) for efficiency
                 for (const userId of potentialRecipientIds) {
                     const user = await storage.users.getUserById(String(userId));
                     if (user) {
                         recipients.push(user);
                     } else {
                          logger(`[NotificationService] User ID ${userId} not found during recipient fetch.`, 'Notification');
                     }
                 }
            } else {
                 logger(`[NotificationService] No recipients found for project-wide message (excluding sender).`, 'Notification');
            }
        }

        // 3. Send Emails
        if (recipients.length > 0) {
            logger(`[NotificationService] Sending notifications to ${recipients.length} recipients for message ${message.id}...`, 'Notification');
            const emailPromises = recipients.map(recipient =>
                sendNewMessageNotificationEmail({
                    recipientEmail: recipient.email,
                    recipientFirstName: recipient.firstName,
                    senderName: senderName,
                    projectName: projectName,
                    messageSubject: message.subject,
                    messageLink: messageLink,
                }).catch(err => {
                    // Log individual email errors but don't stop others
                    logger(`[NotificationService] Failed to send notification to ${recipient.email}: ${err instanceof Error ? err.message : err}`, 'NotificationError');
                })
            );
            await Promise.all(emailPromises);
            logger(`[NotificationService] Finished sending notifications for message ${message.id}.`, 'Notification');
        } else {
             logger(`[NotificationService] No valid recipients to notify for message ${message.id}.`, 'Notification');
        }

    } catch (error) {
        logger(`[NotificationService] General error processing notification for message ${message.id}: ${error instanceof Error ? error.message : error}`, 'NotificationError');
        // Consider logging the full error object for more details
        console.error(error);
    }
}
