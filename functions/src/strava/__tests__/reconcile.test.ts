import { decideStravaAssociate } from '../reconcile';

describe('decideStravaAssociate — task 4.4c, reconciliação pelo e-mail', () => {
  it('reconciles into the associate found by e-mail instead of creating a duplicate', () => {
    const decision = decideStravaAssociate({
      associateIdByAthleteId: null,
      associateIdByEmail: 'existing-associate-uid',
    });

    expect(decision).toEqual({ action: 'use_existing', associateId: 'existing-associate-uid' });
  });

  it('prefers the athlete_id match over the e-mail match (reautorização after the Strava app is replaced)', () => {
    const decision = decideStravaAssociate({
      associateIdByAthleteId: 'associate-by-athlete',
      associateIdByEmail: 'associate-by-email',
    });

    expect(decision).toEqual({ action: 'use_existing', associateId: 'associate-by-athlete' });
  });

  it('creates a new associate only when neither the athlete nor the e-mail match anything', () => {
    const decision = decideStravaAssociate({
      associateIdByAthleteId: null,
      associateIdByEmail: null,
    });

    expect(decision).toEqual({ action: 'create_new' });
  });
});
