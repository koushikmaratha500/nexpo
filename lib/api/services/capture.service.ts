import { HttpError } from '@/lib/api/middleware/errorHandler';
import { assessCaptureMessages, type CaptureAssessment } from '@/lib/ai/agents/capture.agent';
import { getAiConfig } from '@/lib/ai/config';
import { unwrapProviderError } from '@/lib/ai/errors';
import { AiUsageRepository } from '../repositories/aiUsage.repository';
import { CaptureDecisionRepository } from '../repositories/capture-decision.repository';
import { MetaRepository } from '../repositories/meta.repository';
import type { CaptureAssessRequest, CaptureRejectRequest, CaptureSaveRequest } from '../dtos/capture.dto';
import { TransactionService } from './transaction.service';

const DECISIONS_PAGE = 1000;

/** Loose merchant match: "Swiggy" vs "SWIGGY INSTAMART", ignoring case and punctuation. */
export function similarMerchant(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return true; // nothing to compare: amount + type + date decide
  return x.includes(y) || y.includes(x);
}

export type CaptureAssessmentResult = CaptureAssessment & { duplicateOf: string | null };

/**
 * Mobile auto-capture: AI verification of captured bank SMS / payment notifications and the
 * user's Save/Reject decisions. Message text is processed in memory only and never stored.
 */
export class CaptureService {
  static async assess(userId: string, input: CaptureAssessRequest): Promise<{ items: CaptureAssessmentResult[] }> {
    const startedAt = Date.now();
    const model = getAiConfig().modelFor('structured');
    const [categories, paymentTypes, history] = await Promise.all([
      MetaRepository.getActiveCategories(),
      MetaRepository.getActivePaymentTypes(),
      CaptureDecisionRepository.merchantHistory(userId),
    ]);

    let assessed;
    try {
      assessed = await assessCaptureMessages({
        items: input.items,
        categories: categories.map((c) => c.name),
        paymentModes: paymentTypes.map((p) => p.name),
        merchantHistory: history,
      });
    } catch (error) {
      if (!(error instanceof HttpError && error.status === 503)) {
        await AiUsageRepository.create({
          userId,
          feature: 'capture',
          model,
          latencyMs: Date.now() - startedAt,
          status: 'ERROR',
          error: unwrapProviderError(error).message.slice(0, 500),
        }).catch(() => {
          // Audit logging must never mask the original error.
        });
      }
      throw error;
    }

    // The user's own past choice for a merchant beats the model's guess.
    const userCategory = new Map(history.map((h) => [h.merchant.toLowerCase(), h.category]));
    const references = assessed.results.map((r) => r.reference).filter((r): r is string => !!r);
    const savedByRef = new Map(
      (await CaptureDecisionRepository.savedByReferences(userId, references)).map((d) => [d.reference, d.transactionId]),
    );

    const items: CaptureAssessmentResult[] = [];
    for (const r of assessed.results) {
      let duplicateOf: string | null = null;
      if (r.isTransaction) {
        duplicateOf = (r.reference && savedByRef.get(r.reference)) || null;
        if (!duplicateOf && r.kind && r.amount) {
          const received = input.items.find((i) => i.id === r.id)?.receivedAt;
          const date = r.date ? new Date(`${r.date}T12:00:00Z`) : new Date(received ?? Date.now());
          const candidates = await CaptureDecisionRepository.findLedgerCandidates(userId, r.kind, r.amount, date);
          duplicateOf = candidates.find((c) => similarMerchant(c.merchant ?? c.title, r.merchant))?.id ?? null;
        }
      }
      const known = r.merchant ? userCategory.get(r.merchant.toLowerCase()) : undefined;
      items.push({ ...r, category: known ?? r.category, duplicateOf });
    }

    // Separate feature name: verification does not use the Free plan's AI chat allowance.
    await AiUsageRepository.create({
      userId,
      feature: 'capture',
      model,
      inputTokens: assessed.inputTokens,
      outputTokens: assessed.outputTokens,
      latencyMs: Date.now() - startedAt,
      status: 'OK',
    });
    return { items };
  }

  static async decisions(userId: string, since: Date | null, cursor: string | null) {
    const rows = await CaptureDecisionRepository.listSince(userId, since, cursor, DECISIONS_PAGE);
    return {
      fingerprints: rows.map((r) => r.fingerprint),
      references: [...new Set(rows.map((r) => r.reference).filter((r): r is string => !!r))],
      nextCursor: rows.length === DECISIONS_PAGE ? rows[rows.length - 1].id : null,
    };
  }

  /** Idempotent. A message the user already saved stays saved. */
  static async reject(userId: string, input: CaptureRejectRequest) {
    await CaptureDecisionRepository.createIfAbsent({
      userId,
      fingerprint: input.fingerprint,
      reference: input.reference,
      decision: 'REJECTED',
    });
    return { ok: true };
  }

  /**
   * Creates the transaction once per message: the decision row is reserved first (unique per
   * fingerprint), so a double tap, retry or second phone returns the same transaction.
   */
  static async save(userId: string, input: CaptureSaveRequest, meta: { ip?: string; ua?: string } = {}) {
    let decision = await CaptureDecisionRepository.createIfAbsent({
      userId,
      fingerprint: input.fingerprint,
      reference: input.reference,
      decision: 'SAVED',
    });

    if (!decision) {
      const existing = await CaptureDecisionRepository.findByFingerprint(userId, input.fingerprint);
      if (existing?.decision === 'SAVED') {
        if (existing.transactionId) return TransactionService.getTransactionById(existing.transactionId, userId);
        throw new HttpError(409, 'This payment is already being saved');
      }
      if (!existing) throw new HttpError(409, 'Please try again');
      // Rejected earlier, now restored and saved by the user.
      decision = await CaptureDecisionRepository.update(existing.id, { decision: 'SAVED' });
    }

    try {
      const transaction = await TransactionService.createTransaction(userId, input.transaction, meta);
      await CaptureDecisionRepository.update(decision.id, { transactionId: transaction.id });
      return transaction;
    } catch (error) {
      try {
        await CaptureDecisionRepository.delete(decision.id);
      } catch {
        // Keep the original error; a stale reservation only blocks this one message.
      }
      throw error;
    }
  }
}
