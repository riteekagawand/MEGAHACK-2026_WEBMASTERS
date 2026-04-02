/**
 * Generate a Google Meet link for virtual consultations
 * Uses a deterministic approach based on appointment details
 */
export function generateGoogleMeetLink(
  appointmentId: string,
  doctorId: string,
  date: string,
  time: string
): string {
  // Create a unique but deterministic meeting ID
  const uniqueId = `${appointmentId}_${doctorId}_${date}_${time}`;
  const hash = simpleHash(uniqueId);
  const meetId = `meet-${hash.substring(0, 12)}`;
  
  return `https://meet.google.com/${meetId}`;
}

/**
 * Simple hash function to create a readable meeting ID
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format a Google Meet link for display
 */
export function formatMeetingLink(meetLink: string): string {
  return meetLink.replace('https://meet.google.com/', '');
}
