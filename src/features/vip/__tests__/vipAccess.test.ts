import { getDoc, setDoc } from '@react-native-firebase/firestore';
import { getOrCreateAccess, buildQrPayload } from '../../../data/vipAccessRepository';
import type { VipAccess, WithId } from '../../../data/types';

/**
 * Covers task 6.3/6.4 acceptance criteria against the existing (not mine to
 * edit) `vipAccessRepository`: reusing an existing access instead of
 * duplicating it, deriving `expires_at` from the event's `vip_window`
 * (never a fixed duration), and assembling the 5-field versioned QR payload.
 */

const mockedGetDoc = getDoc as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;

function fakeTimestamp(iso: string) {
  const date = new Date(iso);
  return { toDate: () => date };
}

beforeEach(() => {
  mockedGetDoc.mockReset();
  mockedSetDoc.mockReset();
});

describe('vipAccessRepository.getOrCreateAccess', () => {
  it('reuses an existing, non-revoked access instead of creating a new one', async () => {
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        associate_id: 'assoc_1',
        event_id: 'evt_1',
        issued_at: fakeTimestamp('2026-10-01T10:00:00Z'),
        expires_at: fakeTimestamp('2026-10-18T15:00:00Z'),
        revoked_at: null,
      }),
    });

    const access = await getOrCreateAccess('assoc_1', 'evt_1');

    expect(access.id).toBe('assoc_1_evt_1');
    expect(mockedSetDoc).not.toHaveBeenCalled();
    // A single read is enough to resolve the existing, reusable access.
    expect(mockedGetDoc).toHaveBeenCalledTimes(1);
  });

  it('derives expires_at from the event vip_window, not a fixed duration', async () => {
    const vipWindowEnd = fakeTimestamp('2026-11-08T18:00:00Z');

    mockedGetDoc
      // 1) getAccess lookup — no existing document
      .mockResolvedValueOnce({ exists: () => false })
      // 2) eventsRepository.getEvent — event has a VIP window
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Trekking Paranapiacaba',
          has_vip: true,
          vip_window: { starts_at: fakeTimestamp('2026-11-08T09:00:00Z'), ends_at: vipWindowEnd },
        }),
      })
      // 3) re-read after setDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          associate_id: 'assoc_2',
          event_id: 'evt_2',
          issued_at: fakeTimestamp('2026-11-01T00:00:00Z'),
          expires_at: vipWindowEnd,
          revoked_at: null,
        }),
      });

    const access = await getOrCreateAccess('assoc_2', 'evt_2');

    expect(mockedSetDoc).toHaveBeenCalledTimes(1);
    const [, writtenData] = mockedSetDoc.mock.calls[0];
    expect(writtenData.expires_at).toBe(vipWindowEnd);
    expect(access.expires_at).toBe(vipWindowEnd);
  });

  it('throws instead of creating an access for an event with no VIP window', async () => {
    mockedGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'Trekking Paranapiacaba', has_vip: false, vip_window: null }),
      });

    await expect(getOrCreateAccess('assoc_3', 'evt_3')).rejects.toThrow();
    expect(mockedSetDoc).not.toHaveBeenCalled();
  });
});

describe('vipAccessRepository.buildQrPayload', () => {
  it('assembles the structured, versioned payload with all 5 fields', () => {
    const access: WithId<VipAccess> = {
      id: 'assoc_1_evt_1',
      associate_id: 'assoc_1',
      event_id: 'evt_1',
      issued_at: fakeTimestamp('2026-10-01T10:00:00Z') as unknown as VipAccess['issued_at'],
      expires_at: fakeTimestamp('2026-10-18T15:00:00Z') as unknown as VipAccess['expires_at'],
      revoked_at: null,
    };

    const payload = buildQrPayload(access);

    expect(payload).toEqual({
      v: 1,
      access: 'assoc_1_evt_1',
      associate: 'assoc_1',
      event: 'evt_1',
      exp: '2026-10-18T15:00:00.000Z',
    });
  });

  it('never calls the network — it is a pure assembly over an already-fetched access', () => {
    mockedGetDoc.mockClear();
    mockedSetDoc.mockClear();

    const access: WithId<VipAccess> = {
      id: 'assoc_1_evt_1',
      associate_id: 'assoc_1',
      event_id: 'evt_1',
      issued_at: fakeTimestamp('2026-10-01T10:00:00Z') as unknown as VipAccess['issued_at'],
      expires_at: fakeTimestamp('2026-10-18T15:00:00Z') as unknown as VipAccess['expires_at'],
      revoked_at: null,
    };

    buildQrPayload(access);

    expect(mockedGetDoc).not.toHaveBeenCalled();
    expect(mockedSetDoc).not.toHaveBeenCalled();
  });
});
