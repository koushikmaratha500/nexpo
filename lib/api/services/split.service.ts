export type SplitMode = 'EQUAL_INCLUDED' | 'CUSTOM_AMOUNT' | 'CUSTOM_PERCENT';

export interface SplitParticipantInput {
  userId: string;
  included: boolean;
  shareAmount?: number;
  sharePercent?: number;
}

export interface SplitParticipantResult {
  userId: string;
  included: boolean;
  shareAmount?: number;
  sharePercent?: number;
  computedAmount: number;
}

const AMOUNT_TOLERANCE = 0.01;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertIncludedParticipants(participants: SplitParticipantInput[]): SplitParticipantInput[] {
  const included = participants.filter((participant) => participant.included);
  if (included.length === 0) {
    throw new Error('At least one group member must be included in the split');
  }
  return included;
}

export class SplitService {
  static calculate(
    mode: SplitMode,
    total: number,
    participants: SplitParticipantInput[],
    payerUserId: string,
  ): SplitParticipantResult[] {
    if (total <= 0) {
      throw new Error('Amount must be a positive number');
    }
    if (participants.length === 0) {
      throw new Error('Split participants are required');
    }

    const included = assertIncludedParticipants(participants);

    if (mode === 'EQUAL_INCLUDED') {
      const share = roundMoney(total / included.length);
      const results = participants.map((participant) => ({
        ...participant,
        computedAmount: participant.included ? share : 0,
      }));

      const sum = roundMoney(results.reduce((acc, row) => acc + row.computedAmount, 0));
      const diff = roundMoney(total - sum);
      if (Math.abs(diff) >= AMOUNT_TOLERANCE) {
        const payerIndex = results.findIndex((row) => row.userId === payerUserId && row.included);
        const adjustIndex = payerIndex >= 0 ? payerIndex : results.findIndex((row) => row.included);
        if (adjustIndex >= 0) {
          results[adjustIndex].computedAmount = roundMoney(results[adjustIndex].computedAmount + diff);
        }
      }
      return results;
    }

    if (mode === 'CUSTOM_AMOUNT') {
      let sum = 0;
      const results = participants.map((participant) => {
        if (!participant.included) {
          return { ...participant, computedAmount: 0 };
        }
        if (participant.shareAmount == null || participant.shareAmount < 0) {
          throw new Error('Custom amount splits require shareAmount for included members');
        }
        sum += participant.shareAmount;
        return {
          ...participant,
          computedAmount: roundMoney(participant.shareAmount),
        };
      });

      if (Math.abs(roundMoney(sum) - roundMoney(total)) > AMOUNT_TOLERANCE) {
        throw new Error('Custom split amounts must sum to the expense total');
      }
      return results;
    }

    let percentSum = 0;
    const results = participants.map((participant) => {
      if (!participant.included) {
        return { ...participant, computedAmount: 0 };
      }
      if (participant.sharePercent == null || participant.sharePercent < 0) {
        throw new Error('Custom percent splits require sharePercent for included members');
      }
      percentSum += participant.sharePercent;
      return {
        ...participant,
        computedAmount: roundMoney(total * (participant.sharePercent / 100)),
      };
    });

    if (Math.abs(roundMoney(percentSum) - 100) > AMOUNT_TOLERANCE) {
      throw new Error('Custom split percents must sum to 100');
    }

    const amountSum = roundMoney(results.reduce((acc, row) => acc + row.computedAmount, 0));
    const diff = roundMoney(total - amountSum);
    if (Math.abs(diff) >= AMOUNT_TOLERANCE) {
      const payerIndex = results.findIndex((row) => row.userId === payerUserId && row.included);
      const adjustIndex = payerIndex >= 0 ? payerIndex : results.findIndex((row) => row.included);
      if (adjustIndex >= 0) {
        results[adjustIndex].computedAmount = roundMoney(results[adjustIndex].computedAmount + diff);
      }
    }

    return results;
  }
}
