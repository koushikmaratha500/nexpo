import { describe, expect, it } from 'vitest';
import { SettlementService } from '@/lib/api/services/settlement.service';

describe('SettlementService', () => {
  it('computes greedy settlement transfers from member balances', () => {
    const transfers = SettlementService.computeTransfers([
      { userId: 'a', firstName: 'Alex', balance: 150 },
      { userId: 'b', firstName: 'Blake', balance: -90 },
      { userId: 'c', firstName: 'Casey', balance: -60 },
    ]);

    expect(transfers).toEqual([
      { fromUserId: 'b', toUserId: 'a', amount: 90 },
      { fromUserId: 'c', toUserId: 'a', amount: 60 },
    ]);
  });

  it('builds a CSV with balances and transfer rows', () => {
    const csv = SettlementService.buildSettlementCsv({
      currency: 'INR',
      members: [
        { userId: 'a', firstName: 'Alex', balance: 100 },
        { userId: 'b', firstName: 'Blake', balance: -100 },
      ],
      transfers: [{ fromUserId: 'b', toUserId: 'a', amount: 100 }],
    });

    expect(csv).toContain('section,member,net_balance,currency');
    expect(csv).toContain('balance,Alex,100.00,INR');
    expect(csv).toContain('transfer,Blake,Alex,100.00,INR');
  });
});
