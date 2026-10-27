import { doc, getDoc, getDocs, query, where } from '@react-native-firebase/firestore';
import { typedCollection, withId } from './firestoreClient';
import type { Benefit, WithId } from './types';

/** `benefits/{benefitId}` — read-only for the app (see firestore.rules). */

const benefitsCollection = () => typedCollection<Benefit>('benefits');

export interface ListBenefitsOptions {
  /** Filter to a single category (e.g. "Alimentação") — omit for every category. */
  category?: string;
}

/**
 * Returns every benefit matching the filter, `active` and `coming_soon`
 * together — the catalog screens (09/10) split them by `status` themselves,
 * since "Em breve" items render differently (not resgatable, no detail, no
 * paywall redirect — task 7.7).
 */
export async function listBenefits(options: ListBenefitsOptions = {}): Promise<WithId<Benefit>[]> {
  const snapshot = options.category
    ? await getDocs(query(benefitsCollection(), where('category', '==', options.category)))
    : await getDocs(benefitsCollection());
  return snapshot.docs.map((d) => withId(d.id, d.data()));
}

export async function getBenefit(benefitId: string): Promise<WithId<Benefit> | null> {
  const snapshot = await getDoc(doc(benefitsCollection(), benefitId));
  if (!snapshot.exists()) return null;
  return withId(benefitId, snapshot.data() as Benefit);
}
