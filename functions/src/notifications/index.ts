/**
 * Notifications domain Cloud Functions — push dispatch on Firestore triggers
 * for the three notification types (new event with VIP, RSVP confirmed, new
 * partner), always writing to `notifications` regardless of delivery
 * (task 9.7), plus invalid-token cleanup (task 9.8).
 */
export { onEventWrittenNotifyVip, onRsvpCreatedNotifyAssociate, onBenefitWrittenNotifyNewPartner } from './triggers';
