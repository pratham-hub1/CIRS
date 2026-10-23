import { ScopedRepository } from '../../src/common/repositories/scoped.repository';

class TestItemRepository extends ScopedRepository {
  public testScope(campusId: string, filter: Record<string, any>) {
    return this.applyCampusScope(campusId, filter);
  }
}

describe('INT-6: Tenancy Isolation - Scoped Repository Structural Check', () => {
  let repo: TestItemRepository;

  beforeEach(() => {
    repo = new TestItemRepository({} as any);
  });

  it('correctly injects campusId into the query where clause', () => {
    const filter = { status: 'FOUND', category: 'ELECTRONICS' };
    const scoped = repo.testScope('campus-123', filter);

    expect(scoped).toEqual({
      status: 'FOUND',
      category: 'ELECTRONICS',
      campusId: 'campus-123',
    });
  });

  it('fails fast and throws an error if campusId is empty or undefined', () => {
    expect(() => repo.testScope('', { status: 'FOUND' })).toThrow(
      'Tenancy violation: campusId must be provided for scoped queries',
    );
    expect(() => repo.testScope('   ', { status: 'FOUND' })).toThrow(
      'Tenancy violation: campusId must be provided for scoped queries',
    );
    expect(() => repo.testScope(undefined as any, { status: 'FOUND' })).toThrow(
      'Tenancy violation: campusId must be provided for scoped queries',
    );
  });
});
