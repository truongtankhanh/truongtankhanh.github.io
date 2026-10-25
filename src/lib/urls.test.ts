import { describe, expect, it } from 'vitest';
import { resume } from '../content/resume';
import { displayUrl } from './urls';

describe('displayUrl', () => {
  it('drops the protocol, "www." and a trailing slash', () => {
    expect(displayUrl('https://github.com/truongtankhanh')).toBe('github.com/truongtankhanh');
    expect(displayUrl('https://www.linkedin.com/in/truongtankhanh/')).toBe('linkedin.com/in/truongtankhanh');
    expect(displayUrl('http://example.com/')).toBe('example.com');
  });

  it('reads the two profile links of the content as the handles people know', () => {
    expect(displayUrl(resume.links.github)).toBe('github.com/truongtankhanh');
    expect(displayUrl(resume.links.linkedin)).toBe('linkedin.com/in/truongtankhanh');
  });
});
