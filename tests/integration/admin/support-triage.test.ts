import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupportService } from '@/lib/api/services/support.service';
import { SupportRepository } from '@/lib/api/repositories/support.repository';

vi.mock('@/lib/api/repositories/support.repository', () => ({
  SupportRepository: {
    findById: vi.fn(),
    update: vi.fn(),
    createAudit: vi.fn(),
  },
}));

const mockedFindById = vi.mocked(SupportRepository.findById);
const mockedUpdate = vi.mocked(SupportRepository.update);
const mockedCreateAudit = vi.mocked(SupportRepository.createAudit);

describe('SupportService ticket triage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates audit rows when closing a ticket', async () => {
    mockedFindById.mockResolvedValue({
      id: 'ticket-1',
      status: 'A',
      adminNotes: null,
    } as never);
    mockedUpdate.mockResolvedValue({
      id: 'ticket-1',
      status: 'I',
      adminNotes: 'Resolved',
    } as never);

    const updated = await SupportService.updateTicket(
      'ticket-1',
      'admin-1',
      { status: 'I', adminNotes: 'Resolved' },
      { ip: '127.0.0.1', ua: 'vitest' },
    );

    expect(updated.status).toBe('I');
    expect(mockedCreateAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        supportTicketId: 'ticket-1',
        adminId: 'admin-1',
      }),
    );
  });
});
