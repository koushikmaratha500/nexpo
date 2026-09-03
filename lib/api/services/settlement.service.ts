export interface BalanceMember {
  userId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  balance: number;
}

export interface SettlementTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

function memberLabel(member: Pick<BalanceMember, 'username' | 'firstName' | 'lastName'>) {
  if (member.username) return `@${member.username}`;
  return `${member.firstName}${member.lastName ? ` ${member.lastName}` : ''}`.trim();
}

export class SettlementService {
  static computeTransfers(members: BalanceMember[]): SettlementTransfer[] {
    const debtors = members
      .filter((member) => member.balance < -0.01)
      .map((member) => ({
        userId: member.userId,
        remaining: Math.round(Math.abs(member.balance) * 100) / 100,
      }));

    const creditors = members
      .filter((member) => member.balance > 0.01)
      .map((member) => ({
        userId: member.userId,
        remaining: Math.round(member.balance * 100) / 100,
      }));

    const transfers: SettlementTransfer[] = [];

    for (const debtor of debtors) {
      let debtorRemaining = debtor.remaining;
      while (debtorRemaining > 0.01 && creditors.length > 0) {
        const creditor = creditors[0];
        const amount = Math.round(Math.min(debtorRemaining, creditor.remaining) * 100) / 100;
        if (amount <= 0) break;

        transfers.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount,
        });

        debtorRemaining = Math.round((debtorRemaining - amount) * 100) / 100;
        creditor.remaining = Math.round((creditor.remaining - amount) * 100) / 100;
        if (creditor.remaining <= 0.01) {
          creditors.shift();
        }
      }
    }

    return transfers;
  }

  static buildSettlementCsv(params: {
    currency: string;
    members: BalanceMember[];
    transfers: SettlementTransfer[];
  }) {
    const memberById = new Map(params.members.map((member) => [member.userId, member]));
    const lines = [
      'section,member,net_balance,currency',
      ...params.members.map(
        (member) =>
          `balance,${this.csvEscape(memberLabel(member))},${member.balance.toFixed(2)},${params.currency}`,
      ),
      'section,from,to,amount,currency',
      ...params.transfers.map((transfer) => {
        const from = memberById.get(transfer.fromUserId);
        const to = memberById.get(transfer.toUserId);
        return `transfer,${this.csvEscape(from ? memberLabel(from) : transfer.fromUserId)},${this.csvEscape(
          to ? memberLabel(to) : transfer.toUserId,
        )},${transfer.amount.toFixed(2)},${params.currency}`;
      }),
    ];
    return lines.join('\n');
  }

  private static csvEscape(value: string) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
