import { describe, expect, it } from 'vitest';
import { findPhoneNumber } from './privacy';

describe('findPhoneNumber', () => {
  it('finds a number however it is written', () => {
    for (const text of [
      '0901234567',
      '090 123 4567',
      '090.123.4567',
      '090-123-4567',
      'Call 0901234567 today',
      '+84 90 123 4567',
      '+84901234567',
      '(+84) 90 123 4567',
      '+84 (0)90 123 4567',
      '0084 90 123 4567',
      '{"phone":"0901234567"}',
    ]) {
      expect(findPhoneNumber(text), text).toBeDefined();
    }
  });

  it('leaves dates, figures, e-mail and URLs alone', () => {
    for (const text of [
      'Apr 2024 – present',
      '2018-12',
      '2020-07 2024-02',
      'About 10,000 messages a second',
      '44 implementation-ready tickets',
      'ttkhanh100896@gmail.com',
      'https://github.com/truongtankhanh/ops-command-center',
      'Surbana Jurong since 2024-04, about 50 repositories',
    ]) {
      expect(findPhoneNumber(text), text).toBeUndefined();
    }
  });
});
