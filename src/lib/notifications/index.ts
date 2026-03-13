/**
 * Simulated Notification Service
 * 
 * In a production environment, this would integrate with services like:
 * - Twilio for SMS
 * - Resend / SendGrid for Emails
 * - Apple/Google APNs for Push Notifications
 */

export type NotificationType = "booking_confirmation" | "booking_cancellation" | "booking_reminder" | "intake_form_link";

export interface NotificationPayload {
  to: string; // phone number or email
  patientName: string;
  type: NotificationType;
  metadata?: Record<string, string>;
}

export async function sendNotification(payload: NotificationPayload) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const timestamp = new Date().toISOString();
  
  console.log(`\n================================`);
  console.log(`🔔 NOTIFICATION SENT [${timestamp}]`);
  console.log(`To: ${payload.to}`);
  console.log(`Patient: ${payload.patientName}`);
  console.log(`Type: ${payload.type}`);
  
  switch (payload.type) {
    case "booking_confirmation":
      console.log(`Message: Hello ${payload.patientName}, your appointment for ${payload.metadata?.service} on ${payload.metadata?.date} at ${payload.metadata?.time} is confirmed.`);
      break
    case "booking_cancellation":
      console.log(`Message: Hello ${payload.patientName}, your appointment for ${payload.metadata?.service} on ${payload.metadata?.date} at ${payload.metadata?.time} has been cancelled.`);
      break
    case "booking_reminder":
      console.log(`Message: Reminder: ${payload.patientName}, you have an appointment tomorrow for ${payload.metadata?.service} at ${payload.metadata?.time}.`);
      break
    case "intake_form_link":
      console.log(`Message: Hello ${payload.patientName}, please complete your secure medical intake form before your visit: http://localhost:3000/intake?formId=${payload.metadata?.formId}&appointmentId=${payload.metadata?.appointmentId}`);
      break
    default:
      console.log(`Message: You have a new notification from Cortex Clinic.`);
  }
  
  console.log(`================================\n`);
  
  return { success: true, timestamp };
}
