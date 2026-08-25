import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRepository } from '@/lib/api/repositories/user.repository';

const mockedCreate = vi.fn();
const mockedUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => mockedCreate(...args),
      update: (...args: unknown[]) => mockedUpdate(...args),
    },
  },
}));

describe('UserRepository password timestamps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreate.mockResolvedValue({ id: 'user-1' });
    mockedUpdate.mockResolvedValue({ id: 'user-1' });
  });

  it('sets lastPasswordChangedDate on create when passwordHash is provided', async () => {
    await UserRepository.create({
      firstName: 'Test',
      email: 'test@example.com',
      passwordHash: 'salt:hash',
    });

    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        passwordHash: 'salt:hash',
        lastPasswordChangedDate: expect.any(Date),
      }),
    });
  });

  it('sets lastPasswordChangedDate on update when passwordHash changes', async () => {
    await UserRepository.update('user-1', {
      passwordHash: 'salt:newhash',
    });

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        passwordHash: 'salt:newhash',
        lastPasswordChangedDate: expect.any(Date),
      }),
    });
  });

  it('does not overwrite an explicit lastPasswordChangedDate on update', async () => {
    const explicitDate = new Date('2024-01-01T00:00:00.000Z');

    await UserRepository.update('user-1', {
      passwordHash: 'salt:newhash',
      lastPasswordChangedDate: explicitDate,
    });

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        lastPasswordChangedDate: explicitDate,
      }),
    });
  });

  it('does not set lastPasswordChangedDate when passwordHash is unchanged', async () => {
    await UserRepository.update('user-1', {
      firstName: 'Updated',
    });

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { firstName: 'Updated' },
    });
  });
});
