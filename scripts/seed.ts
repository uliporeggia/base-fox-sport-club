/**
 * Seed script for Base Fox Sport Club pilot — initial data seeding.
 *
 * **USAGE** (run once from the repository root):
 *
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 *   npm run seed
 *
 * `npm run seed` points NODE_PATH at functions/node_modules — the only
 * place firebase-admin is actually installed in this repo — and runs this
 * file directly with Node's built-in TypeScript support (no compile step,
 * no ts-node/tsx, no stray .js file left behind).
 *
 * (Optional) Point to a different Firebase project:
 *   export FIREBASE_PROJECT_ID="your-project-id"
 *
 * The script is idempotent — running it twice does not duplicate data; it
 * uses deterministic document ids and `.set()`. The one exception is
 * `config/counters`: if `member_number` is already non-zero (the
 * `assignMemberNumber` Cloud Function may have advanced it), the script
 * refuses to overwrite it and only reports the current value.
 *
 * **Data sources:**
 * - Events, benefits: `/home/uli/.claude/jobs/b6b829ff/tmp/UI-REFERENCE.md` (pilot mockup)
 * - Model: `openspec/changes/base-fox-mvp/design.md` → "Modelo de dados" table
 * - Types: `src/data/types.ts`
 *
 * Uses the modular firebase-admin API (`firebase-admin/app`,
 * `firebase-admin/firestore`) — the same API surface as
 * functions/src/strava/index.ts, which already migrated off the removed
 * namespaced API (`admin.firestore()` no longer exists in firebase-admin
 * v14). Plain `require()` on purpose: NODE_PATH-based module resolution
 * only applies to CommonJS, and that's what lets this script find
 * firebase-admin without a root-level `npm install`.
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// ============================================================================
// Types (duplicated from src/data/types.ts to avoid import path issues)
// See src/data/types.ts for the canonical definitions.
// ============================================================================

type FirestoreTimestamp = InstanceType<typeof Timestamp>;
type EventModality = 'corrida' | 'trilha' | 'trekking';
type EventOrganizer = 'base_fox' | 'third_party';
type BenefitStatus = 'active' | 'coming_soon';

interface EventVipWindow {
  starts_at: FirestoreTimestamp;
  ends_at: FirestoreTimestamp;
}

interface EventRecord {
  name: string;
  modality: EventModality;
  distance: string;
  starts_at: FirestoreTimestamp;
  location: string;
  description: string;
  organizer: EventOrganizer;
  has_vip: boolean;
  vip_window: EventVipWindow | null;
  vip_perks: string[];
}

interface Benefit {
  partner: string;
  category: string;
  discount: string | null;
  description: string;
  code: string | null;
  external_url: string | null;
  usage_note: string | null;
  valid_until: FirestoreTimestamp | null;
  status: BenefitStatus;
}

interface ConfigApp {
  membershipEnabled: boolean;
  strava: {
    client_id: string;
  };
}

interface ConfigCounters {
  member_number: number;
}

// ============================================================================
// Initialize Firebase Admin SDK
// ============================================================================

const projectId = process.env.FIREBASE_PROJECT_ID;

initializeApp({
  projectId,
  // Credentials come from GOOGLE_APPLICATION_CREDENTIALS environment variable
});

const db = getFirestore();

// ============================================================================
// Seed Data
// ============================================================================

const events: Record<string, EventRecord> = {
  // Corrida Base Fox 10K — 18 Oct 2026, 6:30 AM, Villa-Lobos, SP
  evt_corrida_basefox_10k: {
    name: 'Corrida Base Fox 10K',
    modality: 'corrida',
    distance: '10 km',
    starts_at: Timestamp.fromDate(new Date('2026-10-18T06:30:00Z')),
    location: 'Villa-Lobos, SP',
    description: 'Uma corrida de 10 km pelo Parque Villa-Lobos com percurso desafiador e vista de São Paulo.',
    organizer: 'base_fox',
    has_vip: true,
    vip_window: {
      starts_at: Timestamp.fromDate(new Date('2026-10-17T18:00:00Z')),
      ends_at: Timestamp.fromDate(new Date('2026-10-18T04:00:00Z')),
    },
    vip_perks: ['Acesso prioritário', 'Brinde exclusivo'],
  },

  // Trilha da Pedra Grande — 26 Oct 2026, 7:00 AM, Atibaia, SP
  evt_trilha_pedra_grande: {
    name: 'Trilha da Pedra Grande',
    modality: 'trilha',
    distance: '12 km',
    starts_at: Timestamp.fromDate(new Date('2026-10-26T07:00:00Z')),
    location: 'Atibaia, SP',
    description: 'Trilha técnica de 12 km na região de Atibaia com vistas panorâmicas e desafio moderado.',
    organizer: 'base_fox',
    has_vip: true,
    vip_window: {
      starts_at: Timestamp.fromDate(new Date('2026-10-25T19:00:00Z')),
      ends_at: Timestamp.fromDate(new Date('2026-10-26T05:00:00Z')),
    },
    vip_perks: ['Acesso prioritário', 'Consulta com guia'],
  },

  // Trekking Paranapiacaba — 08 Nov 2026, 6:00 AM, Santo André, SP
  evt_trekking_paranapiacaba: {
    name: 'Trekking Paranapiacaba',
    modality: 'trekking',
    distance: '18 km',
    starts_at: Timestamp.fromDate(new Date('2026-11-08T06:00:00Z')),
    location: 'Santo André, SP',
    description: 'Trekking de longa distância de 18 km na região da Serra do Mar com história e biodiversidade.',
    organizer: 'base_fox',
    has_vip: false,
    vip_window: null,
    vip_perks: [],
  },

  // Night Run Base Fox — 15 Nov 2026, 7:30 PM, Ibirapuera, SP
  evt_night_run_basefox: {
    name: 'Night Run Base Fox',
    modality: 'corrida',
    distance: '5 km',
    starts_at: Timestamp.fromDate(new Date('2026-11-15T19:30:00Z')),
    location: 'Ibirapuera, SP',
    description: 'Corrida noturna de 5 km no Parque Ibirapuera com iluminação e ambiente festivo.',
    organizer: 'base_fox',
    has_vip: true,
    vip_window: {
      starts_at: Timestamp.fromDate(new Date('2026-11-14T20:00:00Z')),
      ends_at: Timestamp.fromDate(new Date('2026-11-15T17:00:00Z')),
    },
    vip_perks: ['Acesso prioritário', 'Camiseta VIP'],
  },
};

const benefits: Record<string, Benefit> = {
  // Base Fox — 15% discount on event registrations (active)
  ben_basefox_cupom15: {
    partner: 'Inscrições Base Fox',
    category: 'Eventos',
    discount: '15% OFF',
    description: '15% de desconto nas inscrições de eventos do clube',
    code: 'BASEFOX15',
    external_url: 'https://inscricoes.example.com/base-fox', // TODO: URL real das inscrições, a confirmar com o cliente
    usage_note: 'Vale para todos os eventos próprios do clube — corrida, trilha e trekking. Use no checkout da inscrição.',
    valid_until: Timestamp.fromDate(new Date('2026-12-31T23:59:59Z')),
    status: 'active',
  },

  // Cafeteria parceira — coming soon
  ben_cafeteria_comingsoon: {
    partner: 'Cafeteria parceira',
    category: 'Alimentação',
    discount: null,
    description: 'Desconto em estabelecimentos de alimentação',
    code: null,
    external_url: null,
    usage_note: null,
    valid_until: null,
    status: 'coming_soon',
  },

  // Nutrição esportiva — coming soon
  ben_nutricao_comingsoon: {
    partner: 'Nutrição esportiva',
    category: 'Alimentação',
    discount: null,
    description: 'Desconto em produtos de nutrição esportiva',
    code: null,
    external_url: null,
    usage_note: null,
    valid_until: null,
    status: 'coming_soon',
  },

  // Loja de corrida e trilha — coming soon
  ben_loja_comingsoon: {
    partner: 'Loja de corrida e trilha',
    category: 'Equipamentos',
    discount: null,
    description: 'Desconto em equipamentos para atividades ao ar livre',
    code: null,
    external_url: null,
    usage_note: null,
    valid_until: null,
    status: 'coming_soon',
  },
};

const configApp: ConfigApp = {
  membershipEnabled: false,
  strava: {
    client_id: '', // Placeholder — to be filled during provisioning
  },
};

const configCounters: ConfigCounters = {
  member_number: 0,
};

// ============================================================================
// Seed Functions
// ============================================================================

async function seedEvents(): Promise<void> {
  console.log('Seeding events...');
  let count = 0;
  for (const [eventId, eventData] of Object.entries(events)) {
    await db.collection('events').doc(eventId).set(eventData);
    count++;
  }
  console.log(`✓ ${count} events seeded`);
}

async function seedBenefits(): Promise<void> {
  console.log('Seeding benefits...');
  let count = 0;
  for (const [benefitId, benefitData] of Object.entries(benefits)) {
    await db.collection('benefits').doc(benefitId).set(benefitData);
    count++;
  }
  console.log(`✓ ${count} benefits seeded`);
}

async function seedConfigApp(): Promise<void> {
  await db.collection('config').doc('app').set(configApp);
  console.log('✓ config/app seeded (membershipEnabled: false, strava.client_id: placeholder)');
}

/**
 * config/counters is special: `assignMemberNumber` (Cloud Function, already
 * deployed and active) increments `member_number` transactionally for every
 * new associate. Blindly `.set()`-ing it back to 0 here would duplicate
 * member numbers for anyone who already signed up. So: read first, and only
 * write if the document is missing or already at 0 (both are no-ops for a
 * counter in active use).
 */
async function seedConfigCounters(): Promise<{ wrote: boolean; currentValue: number | null }> {
  const ref = db.collection('config').doc('counters');
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set(configCounters);
    console.log('✓ config/counters initialized (member_number: 0)');
    return { wrote: true, currentValue: 0 };
  }

  const data = snap.data();
  const currentValue = typeof data?.member_number === 'number' ? data.member_number : null;

  if (currentValue === 0) {
    await ref.set(configCounters);
    console.log('✓ config/counters already at 0 — re-set is a no-op');
    return { wrote: true, currentValue: 0 };
  }

  console.warn(
    `⚠ config/counters.member_number is ${currentValue} (not 0) — NOT overwriting. ` +
      'assignMemberNumber appears to already be in use; reporting instead of resetting.'
  );
  return { wrote: false, currentValue };
}

async function printSummary(): Promise<void> {
  console.log('\n=== Estado atual do banco ===\n');

  const eventsSnap = await db.collection('events').get();
  console.log(`events: ${eventsSnap.size} documento(s)`);
  for (const doc of eventsSnap.docs) {
    console.log(`  - ${doc.id}: ${doc.data().name}`);
  }

  const benefitsSnap = await db.collection('benefits').get();
  console.log(`benefits: ${benefitsSnap.size} documento(s)`);
  for (const doc of benefitsSnap.docs) {
    const b = doc.data();
    console.log(`  - ${doc.id}: ${b.partner} [${b.status}]`);
  }

  const appSnap = await db.collection('config').doc('app').get();
  console.log('config/app:', JSON.stringify(appSnap.data()));

  const countersSnap = await db.collection('config').doc('counters').get();
  console.log('config/counters:', JSON.stringify(countersSnap.data()));

  console.log('\n=== Fim do resumo ===\n');
}

async function main(): Promise<void> {
  try {
    console.log('\n=== Base Fox Sport Club — Pilot Seed ===\n');

    await seedEvents();
    await seedBenefits();
    await seedConfigApp();
    await seedConfigCounters();
    await printSummary();

    console.log('\n=== Seed complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
