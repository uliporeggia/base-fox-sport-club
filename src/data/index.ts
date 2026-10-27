/**
 * Single entry point for the repository layer. Screens/components/hooks
 * import repositories from here (or directly from the individual files) —
 * never the Firestore SDK itself (contract rule 3).
 */
export * as associatesRepository from './associatesRepository';
export * as eventsRepository from './eventsRepository';
export * as rsvpsRepository from './rsvpsRepository';
export * as benefitsRepository from './benefitsRepository';
export * as vipAccessRepository from './vipAccessRepository';
export * as notificationsRepository from './notificationsRepository';
export * as devicesRepository from './devicesRepository';
export * as configRepository from './configRepository';

export * from './types';
