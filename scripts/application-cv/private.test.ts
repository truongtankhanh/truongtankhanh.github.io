import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findPhoneNumber } from '../../src/lib/privacy';

interface Loaded {
  phone: string;
  linkedin?: string;
  extraProjects: unknown[];
  overrides: Record<string, unknown>;
}
interface Private {
  CV_DIR: string;
  PRIVATE_FILE: string;
  KEYS: string[];
  PrivateDataError: new (message: string) => Error;
  PROJECT_REQUIRED: string[];
  PROJECT_OPTIONAL: string[];
  isPhoneNumber(text: string): boolean;
  checkProjects(projects: unknown[]): string | undefined;
  loadPrivate(where?: { file?: string; cvDir?: string }): Loaded;
}

// The module is plain JavaScript; a computed specifier keeps the type checker out of it.
const path = './private.mjs';
const {
  CV_DIR,
  PRIVATE_FILE,
  KEYS,
  PROJECT_REQUIRED,
  PROJECT_OPTIONAL,
  PrivateDataError,
  isPhoneNumber,
  checkProjects,
  loadPrivate,
} = (await import(path)) as Private;

// Numbers are put together here and not written out, so no number appears in this file: the repository holds none
// outside what the privacy test needs.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const COUNTRY = '8' + '4';
/** `0` and nine digits, grouped 0xx xxx xxxx with `sep` between the groups. */
const national = (sep = '') => ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(sep);
/** The country code after `prefix`, then nine digits, grouped with `sep`. */
const international = (prefix: string, sep = ' ') =>
  [prefix + COUNTRY, NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(sep);

/** The least a project may be, and one with every field. */
const least = {
  name: 'A project',
  company: 'A company',
  duration: '3 months',
  tableRole: 'Developer',
  role: 'Developer of a service',
  source: 'made up',
};
const most = {
  ...least,
  title: 'A project (a title)',
  overview: 'What it is.',
  team: '3 developers',
  stack: 'Node.js, TypeScript',
  responsibilities: ['Built a thing.', 'Reviewed a thing.'],
  privateOnly: ['a made-up client'],
};

const accepted: [string, string][] = [
  ['national, no separator', national()],
  ['national with spaces', national(' ')],
  ['national with dots', national('.')],
  ['national with dashes', national('-')],
  ['international with a plus', international('+')],
  ['international with a plus and no spaces', international('+', '')],
  ['international in parentheses', `(+${COUNTRY}) ${NINE.slice(0, 2)} ${NINE.slice(2, 5)} ${NINE.slice(5)}`],
  [
    'international with the trunk zero',
    `+${COUNTRY} (0)${NINE.slice(0, 2)} ${NINE.slice(2, 5)} ${NINE.slice(5)}`,
  ],
  ['international with two zeros', international('00')],
];

const rejected: [string, string][] = [
  ['empty', ''],
  ['blank', '   '],
  ['the placeholder of the example file', 'REPLACE_WITH_YOUR_PHONE_NUMBER'],
  ['a national number with a digit missing', national().slice(0, -1)],
  ['a national number with a digit too many', national() + '0'],
  ['nine digits without the leading zero', NINE],
  ['the country code without a plus', `${COUNTRY} ${NINE}`],
  ['a number with a letter', national() + 'x'],
  ['a number in parentheses the scan cannot read', `(0${NINE.slice(0, 2)}) ${NINE.slice(2)}`],
];

describe('isPhoneNumber', () => {
  it.each(accepted)('accepts %s', (_name, phone) => {
    expect(isPhoneNumber(phone)).toBe(true);
  });

  it.each(accepted)('accepts only what the privacy scan of the site can find: %s', (_name, phone) => {
    expect(findPhoneNumber(phone)).toBeDefined();
  });

  it.each(rejected)('refuses %s', (_name, phone) => {
    expect(isPhoneNumber(phone)).toBe(false);
  });
});

describe('loadPrivate', () => {
  let root: string;
  let cv: string;
  let file: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'private-'));
    cv = join(root, 'cv');
    mkdirSync(cv);
    file = join(cv, 'private.json');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const put = (data: unknown) => writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data));
  const load = () => loadPrivate({ file, cvDir: cv });
  /** The message of the error `load` throws, so a check can read all of it. */
  function message(): string {
    try {
      load();
    } catch (error) {
      expect(error).toBeInstanceOf(PrivateDataError);
      return (error as Error).message;
    }
    throw new Error('load did not throw');
  }

  it('stops, naming the file and the example, when the file is missing', () => {
    const text = message();
    expect(text).toContain(file);
    expect(text).toMatch(/missing/);
    expect(text).toContain('private.example.json');
  });

  it('stops when the cv folder itself is missing', () => {
    rmSync(cv, { recursive: true });
    expect(message()).toMatch(/missing/);
  });

  it('reads the phone number, trimmed, and gives an empty list and object for what is left out', () => {
    put({ phone: `  ${national(' ')}  ` });
    expect(load()).toEqual({ phone: national(' '), extraProjects: [], overrides: {} });
  });

  it('keeps the optional keys when they are given', () => {
    const linkedin = 'https://www.linkedin.com/in/example/';
    const extraProjects = [least, most];
    const overrides = { title: 'A title' };
    put({ phone: national(), linkedin, extraProjects, overrides });
    expect(load()).toEqual({ phone: national(), linkedin, extraProjects, overrides });
  });

  it('ignores a key that starts with a dollar sign', () => {
    put({ $comment: 'a note', phone: national() });
    expect(load().phone).toBe(national());
  });

  it.each([{}, { phone: '' }, { phone: '   ' }, { phone: 7 }])(
    'refuses a phone number that is missing or empty: %j',
    (data) => {
      put(data);
      expect(message()).toMatch(/"phone" is missing or empty/);
    },
  );

  it('refuses a phone number that is not one, without repeating it', () => {
    const wrong = national() + 'x';
    put({ phone: wrong });
    const text = message();
    expect(text).toMatch(/"phone" is not a Vietnamese number/);
    expect(text).not.toContain(NINE);
  });

  it('refuses a file that is not JSON, without quoting it', () => {
    put(`{"phone": "${national()}" oops`);
    const text = message();
    expect(text).toMatch(/not valid JSON/);
    expect(text).not.toContain(NINE);
  });

  it.each([[[]], ['text'], [null]])('refuses JSON that is not an object: %j', (data) => {
    put(JSON.stringify(data));
    expect(message()).toMatch(/one JSON object/);
  });

  it('refuses a key it does not know, so a typo does not pass', () => {
    put({ phon: national(), phone: national() });
    expect(message()).toMatch(/unknown key: phon\./);
  });

  it.each([
    'http://www.linkedin.com/in/example/',
    'https://example.com/in/example/',
    'https://notlinkedin.com/in/example/',
    'not an address',
  ])('refuses the LinkedIn address %s', (linkedin) => {
    put({ phone: national(), linkedin });
    expect(message()).toMatch(/"linkedin"/);
  });

  it('accepts a LinkedIn address with or without www', () => {
    for (const linkedin of ['https://www.linkedin.com/in/example/', 'https://linkedin.com/in/example']) {
      put({ phone: national(), linkedin });
      expect(load().linkedin).toBe(linkedin);
    }
  });

  it('refuses extraProjects that is not an array and overrides that is not an object', () => {
    put({ phone: national(), extraProjects: {} });
    expect(message()).toMatch(/"extraProjects" must be an array/);
    put({ phone: national(), overrides: [] });
    expect(message()).toMatch(/"overrides" must be an object/);
  });

  it('refuses a file outside the cv folder', () => {
    file = join(root, 'private.json');
    put({ phone: national() });
    expect(message()).toMatch(/inside the cv\/ folder/);
  });

  it('refuses a link from the cv folder to a file outside it', () => {
    const outside = join(root, 'outside.json');
    writeFileSync(outside, JSON.stringify({ phone: national() }));
    symlinkSync(outside, file);
    expect(message()).toMatch(/inside the cv\/ folder/);
  });
});

describe('checkProjects', () => {
  it('accepts a project with the required fields only, and one with every field', () => {
    expect(checkProjects([least, most])).toBeUndefined();
    expect(checkProjects([])).toBeUndefined();
  });

  it('knows the fields it asks for', () => {
    expect([...PROJECT_REQUIRED].sort()).toEqual(Object.keys(least).sort());
    expect([...PROJECT_OPTIONAL].sort()).toEqual([
      'overview',
      'privateOnly',
      'responsibilities',
      'stack',
      'team',
      'title',
    ]);
  });

  it.each(PROJECT_REQUIRED)('refuses a project without "%s", naming the position and the field', (key) => {
    const project: Record<string, unknown> = { ...least };
    delete project[key];
    expect(checkProjects([least, project])).toBe(`extraProjects[1]: "${key}" must be a non-empty string.`);
  });

  it.each([
    ['an empty string', { role: '  ' }],
    ['a number', { duration: 3 }],
    ['an empty optional string', { overview: '' }],
    ['an optional field that is not text', { team: ['3'] }],
  ])('refuses %s', (_name, change) => {
    expect(checkProjects([{ ...least, ...change }])).toMatch(
      /^extraProjects\[0\]: ".+" must be a non-empty string\.$/,
    );
  });

  describe.each(['responsibilities', 'privateOnly'])('the list %s', (key) => {
    it.each([[[]], ['a bullet'], [['a bullet', '']], [[1]]])('is refused when it is %j', (list) => {
      expect(checkProjects([{ ...least, [key]: list }])).toBe(
        `extraProjects[0]: "${key}" must be a list of non-empty strings.`,
      );
    });
  });

  it('refuses a key it does not know, and anything but an object', () => {
    expect(checkProjects([{ ...least, rol: 'x' }])).toBe('extraProjects[0] has an unknown key: rol.');
    expect(checkProjects(['text'])).toBe('extraProjects[0] must be an object.');
    expect(checkProjects([null])).toBe('extraProjects[0] must be an object.');
  });

  it('never repeats a value in what it says', () => {
    const secret = [1, 2, 3, 4].join('');
    expect(checkProjects([{ ...least, role: 7, name: secret }])).not.toContain(secret);
    expect(checkProjects([{ ...least, [secret]: 'x' }])).toContain(secret); // a key is named, a value never
  });
});

describe('the projects of the private file', () => {
  let root: string;
  let file: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'private-projects-'));
    mkdirSync(join(root, 'cv'));
    file = join(root, 'cv', 'private.json');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const load = () => loadPrivate({ file, cvDir: join(root, 'cv') });

  it('are checked when the file is loaded, and the message names the file, the position and the field', () => {
    writeFileSync(
      file,
      JSON.stringify({ phone: national(), extraProjects: [least, { ...least, role: '' }] }),
    );
    expect(() => load()).toThrow(/private\.json: extraProjects\[1\]: "role" must be a non-empty string\./);
  });

  it('come back as they are written', () => {
    writeFileSync(file, JSON.stringify({ phone: national(), extraProjects: [most] }));
    expect(load().extraProjects).toEqual([most]);
  });
});

describe('the default file', () => {
  it('is cv/private.json of the repository', () => {
    expect(CV_DIR.endsWith('/cv/')).toBe(true);
    expect(PRIVATE_FILE).toBe(`${CV_DIR}private.json`);
  });
});

describe('private.example.json', () => {
  const file = new URL('./private.example.json', import.meta.url);
  const raw = readFileSync(file, 'utf8');
  const example = JSON.parse(raw) as Record<string, unknown>;

  it('holds no number, so the repository holds none', () => {
    expect(findPhoneNumber(raw)).toBeUndefined();
  });

  it('has made-up projects that pass the check, one of a company of the site and one personal', () => {
    const projects = example['extraProjects'] as { company: string; source: string }[];
    expect(checkProjects(projects)).toBeUndefined();
    expect(projects.map((p) => p.company)).toEqual(['NewIT Vietnam', 'Personal project']);
    for (const project of projects) expect(project.source).toMatch(/made up/);
  });

  it('uses only the keys of the loader, and a $comment that explains them', () => {
    for (const key of Object.keys(example)) expect(key === '$comment' || KEYS.includes(key), key).toBe(true);
    expect(typeof example['$comment']).toBe('string');
  });

  it('is refused as it is, because the placeholder is not a number', () => {
    const root = mkdtempSync(join(tmpdir(), 'private-example-'));
    try {
      mkdirSync(join(root, 'cv'));
      writeFileSync(join(root, 'cv', 'private.json'), raw);
      expect(() => loadPrivate({ file: join(root, 'cv', 'private.json'), cvDir: join(root, 'cv') })).toThrow(
        /"phone" is not a Vietnamese number/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
