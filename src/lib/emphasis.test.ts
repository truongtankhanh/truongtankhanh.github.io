import { describe, expect, it } from 'vitest';
import { emphasis, stripEmphasis } from './emphasis';

describe('emphasis', () => {
  it('splits a bullet into plain and strong parts in order', () => {
    expect(emphasis('Built the **camera integration** for MediaMTX.')).toEqual([
      { text: 'Built the ', strong: false },
      { text: 'camera integration', strong: true },
      { text: ' for MediaMTX.', strong: false },
    ]);
  });

  it('handles a phrase at either end and several phrases', () => {
    expect(emphasis('**Sole core developer** of a service')).toEqual([
      { text: 'Sole core developer', strong: true },
      { text: ' of a service', strong: false },
    ]);
    expect(emphasis('Still building the **app**')).toEqual([
      { text: 'Still building the ', strong: false },
      { text: 'app', strong: true },
    ]);
    expect(emphasis('**a**, **b** and **c**').filter((p) => p.strong)).toHaveLength(3);
  });

  it('returns one plain part when there is no marker', () => {
    expect(emphasis('No marker here.')).toEqual([{ text: 'No marker here.', strong: false }]);
  });

  it('gives the text back without its markers', () => {
    expect(stripEmphasis('Set **2D maps with MapLibre and deck.gl**, **single sign-on** and more.')).toBe(
      'Set 2D maps with MapLibre and deck.gl, single sign-on and more.',
    );
  });

  it('throws on an unbalanced or empty marker', () => {
    expect(() => emphasis('One **marker only')).toThrow(/Unbalanced/);
    expect(() => emphasis('Three **a** and **b')).toThrow(/Unbalanced/);
    expect(() => emphasis('Nothing **** between')).toThrow(/Empty/);
    expect(() => emphasis('Blank ** ** between')).toThrow(/Empty/);
  });
});
