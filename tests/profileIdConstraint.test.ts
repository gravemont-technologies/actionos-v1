import { randomBytes } from 'crypto';

describe('profile_id generation', () => {
  it('should always generate a valid 16-char lowercase hex profile_id', () => {
    for (let i = 0; i < 100; i++) {
      const profileId = randomBytes(8).toString('hex');
      expect(profileId).toMatch(/^[a-f0-9]{16}$/);
    }
  });
});
