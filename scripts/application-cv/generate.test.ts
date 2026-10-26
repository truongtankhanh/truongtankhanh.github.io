import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { resume } from '../../src/content/resume';
import type { Resume } from '../../src/content/types';
import { unpackBuffer } from './docxParts';

interface Result {
  file: string;
  bytes: number;
  dryRun: boolean;
  portfolio: { file: string; bytes: number } | null;
  combined: { file: string; bytes: number } | null;
}
interface Generate {
  OUTPUT_FOLDER: string;
  OutputError: new (message: string) => Error;
  generate(input: {
    loadResume: () => Promise<Resume>;
    dryRun?: boolean;
    cvDir?: string;
    privateFile?: string;
  }): Promise<Result>;
}
interface Private {
  PrivateDataError: new (message: string) => Error;
}

// The modules are plain JavaScript; computed specifiers keep the type checker out of them.
const generatePath = './generate.mjs';
const privatePath = './private.mjs';
const { OUTPUT_FOLDER, OutputError, generate } = (await import(generatePath)) as Generate;
const { PrivateDataError } = (await import(privatePath)) as Private;

// Put together here and not written out, so no number appears in this file.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].join('');
const PHONE = ['0', NINE.slice(0, 2), NINE.slice(2, 5), NINE.slice(5)].join(' ');
const NAME = 'Truong_Tan_Khanh_CV.docx';
const PORTFOLIO = 'Truong_Tan_Khanh_Project_Portfolio.docx';
const COMBINED = 'Truong_Tan_Khanh_CV_and_Portfolio.docx';
/** A project of the private file, with the least a project may have. */
const project = {
  name: 'Project of the private test file',
  company: 'NewIT Vietnam',
  duration: '3 months',
  tableRole: 'Developer',
  role: 'Developer of the made-up service',
  source: 'made up',
};
const loadResume = async () => resume;

describe('generate', () => {
  let root: string;
  let cv: string;
  let privateFile: string;
  const created: string[] = [];
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'generate-'));
    cv = join(root, 'cv');
    mkdirSync(cv);
    privateFile = join(cv, 'private.json');
  });
  afterEach(() => {
    for (const dir of [root, ...created.splice(0)]) rmSync(dir, { recursive: true, force: true });
  });

  const putPrivate = (data: Record<string, unknown> = {}) =>
    writeFileSync(privateFile, JSON.stringify({ phone: PHONE, ...data }));
  const run = (loader = loadResume) => generate({ loadResume: loader, cvDir: cv, privateFile });
  const parts = (file: string) => unpackBuffer(readFileSync(file));

  it('writes cv/application/Truong_Tan_Khanh_CV.docx with the phone number once', async () => {
    putPrivate();
    const { file, dryRun, bytes } = await run();
    // The real path: the temporary folder of macOS is a link.
    expect(file).toBe(join(realpathSync(cv), OUTPUT_FOLDER, NAME));
    expect(dryRun).toBe(false);
    expect(bytes).toBe(readFileSync(file).length);
    expect(parts(file).body.split(PHONE)).toHaveLength(2);
  });

  it('writes only in cv/application/ and leaves the masters of cv/ as they are', async () => {
    putPrivate();
    const master = join(cv, NAME);
    writeFileSync(master, 'the master');
    await run();
    expect(readFileSync(master, 'utf8')).toBe('the master');
    expect(readdirSync(cv).sort()).toEqual([OUTPUT_FOLDER, NAME, 'private.json'].sort());
    expect(readdirSync(join(cv, OUTPUT_FOLDER))).toEqual([NAME]);
    expect(readdirSync(root)).toEqual(['cv']);
  });

  it('stops, naming the private file, and writes nothing when it is missing', async () => {
    await expect(run()).rejects.toThrow(PrivateDataError);
    await expect(run()).rejects.toThrow(/private\.json.*missing/);
    expect(existsSync(join(cv, OUTPUT_FOLDER))).toBe(false);
  });

  it('does not read the resume when the private file is wrong', async () => {
    let read = false;
    await expect(
      run(async () => {
        read = true;
        return resume;
      }),
    ).rejects.toThrow(PrivateDataError);
    expect(read).toBe(false);
  });

  it('changes the file when a bullet of the resume changes, and overwrites its own earlier file', async () => {
    putPrivate();
    const first = parts((await run()).file).body;
    const changed = structuredClone(resume);
    changed.experience[0]!.work[0]!.points[0] += ' A change.';
    const { file } = await run(async () => changed);
    expect(parts(file).body).not.toBe(first);
    expect(parts(file).body).toContain('A change.');
    expect(readdirSync(join(cv, OUTPUT_FOLDER))).toEqual([NAME]);
  });

  it('uses the LinkedIn address of the private file when it has one', async () => {
    const other = 'https://www.linkedin.com/in/someone-else/';
    putPrivate({ linkedin: other });
    const { rels, body } = parts((await run()).file);
    expect(rels).toContain(`Target="${other}"`);
    expect(rels).not.toContain(resume.links.linkedin);
    expect(body).toContain('linkedin.com/in/someone-else');
  });

  it('refuses a cv/application that is a link to a folder elsewhere, and writes nothing there', async () => {
    putPrivate();
    const elsewhere = join(root, 'elsewhere');
    mkdirSync(elsewhere);
    symlinkSync(elsewhere, join(cv, OUTPUT_FOLDER));
    await expect(run()).rejects.toThrow(OutputError);
    expect(readdirSync(elsewhere)).toEqual([]);
  });

  it('refuses to replace something that is not a plain file', async () => {
    putPrivate();
    mkdirSync(join(cv, OUTPUT_FOLDER, NAME), { recursive: true });
    await expect(run()).rejects.toThrow(/not a plain file/);
  });

  describe('with projects in the private file', () => {
    it('writes the portfolio next to the CV, with the phone number once and the project in it', async () => {
      putPrivate({ extraProjects: [project] });
      const result = await run();
      expect(result.portfolio?.file).toBe(join(realpathSync(cv), OUTPUT_FOLDER, PORTFOLIO));
      expect(result.portfolio?.bytes).toBe(readFileSync(result.portfolio!.file).length);
      expect(readdirSync(join(cv, OUTPUT_FOLDER)).sort()).toEqual([NAME, PORTFOLIO, COMBINED].sort());
      const doc = parts(result.portfolio!.file);
      expect(doc.body.split(PHONE)).toHaveLength(2);
      expect(doc.body).toContain(project.name);
      expect(doc.body).toContain('Project Portfolio');
    });

    it('writes the CV and the portfolio in one file too, with the phone number once and the project in it', async () => {
      putPrivate({ extraProjects: [project] });
      const result = await run();
      expect(result.combined?.file).toBe(join(realpathSync(cv), OUTPUT_FOLDER, COMBINED));
      expect(result.combined?.bytes).toBe(readFileSync(result.combined!.file).length);
      const doc = parts(result.combined!.file);
      expect(doc.body.split(PHONE)).toHaveLength(2);
      expect(doc.body).toContain(project.name);
      expect(doc.body).toContain(resume.headline);
      expect(doc.body).toContain('Project Portfolio');
    });

    it('writes no portfolio when there is no project, and says so', async () => {
      putPrivate();
      const result = await run();
      expect(result.portfolio).toBeNull();
      expect(result.combined).toBeNull();
      expect(readdirSync(join(cv, OUTPUT_FOLDER))).toEqual([NAME]);
    });

    it('stops before the portfolio is written when a project is wrong, naming the position and the field', async () => {
      putPrivate({ extraProjects: [project, { ...project, role: '' }] });
      await expect(run()).rejects.toThrow(/extraProjects\[1\]: "role"/);
      expect(existsSync(join(cv, OUTPUT_FOLDER))).toBe(false);
    });

    it('writes neither file when the place of the portfolio is taken by something that is not a file', async () => {
      putPrivate({ extraProjects: [project] });
      mkdirSync(join(cv, OUTPUT_FOLDER, PORTFOLIO), { recursive: true });
      await expect(run()).rejects.toThrow(/not a plain file/);
      expect(existsSync(join(cv, OUTPUT_FOLDER, NAME))).toBe(false);
    });

    it('writes none of the files when the place of the one-file edition is taken by something that is not a file', async () => {
      putPrivate({ extraProjects: [project] });
      mkdirSync(join(cv, OUTPUT_FOLDER, COMBINED), { recursive: true });
      await expect(run()).rejects.toThrow(/not a plain file/);
      expect(existsSync(join(cv, OUTPUT_FOLDER, NAME))).toBe(false);
      expect(existsSync(join(cv, OUTPUT_FOLDER, PORTFOLIO))).toBe(false);
    });

    it('changes the portfolio when a project changes', async () => {
      putPrivate({ extraProjects: [project] });
      const first = parts((await run()).portfolio!.file).body;
      putPrivate({ extraProjects: [{ ...project, role: 'Developer of another service' }] });
      const second = parts((await run()).portfolio!.file).body;
      expect(second).not.toBe(first);
      expect(second).toContain('Developer of another service');
    });
  });

  describe('as a dry run', () => {
    it('needs no private file, writes to a new temporary folder and uses the placeholder', async () => {
      const result = await generate({ loadResume, dryRun: true, cvDir: cv, privateFile });
      created.push(dirname(result.file));
      expect(result.dryRun).toBe(true);
      expect(result.file.startsWith(`${cv}/`)).toBe(false);
      expect(result.file.startsWith(tmpdir()) || result.file.includes('application-cv-')).toBe(true);
      const doc = parts(result.file);
      expect(doc.body).toContain('(phone on request)');
      expect(doc.body).not.toContain(NINE);
      expect(existsSync(join(cv, OUTPUT_FOLDER))).toBe(false);
    });

    it('also writes the portfolio, from the made-up projects of the example file', async () => {
      putPrivate({ extraProjects: [project] });
      const result = await generate({ loadResume, dryRun: true, cvDir: cv, privateFile });
      created.push(dirname(result.file));
      expect(dirname(result.portfolio!.file)).toBe(dirname(result.file));
      const doc = parts(result.portfolio!.file);
      expect(doc.body).toContain('Example project');
      expect(doc.body).not.toContain(project.name);
      expect(doc.body).toContain('(phone on request)');
      expect(dirname(result.combined!.file)).toBe(dirname(result.file));
      expect(parts(result.combined!.file).body).toContain('Example project');
    });

    it('ignores a private file that is there', async () => {
      putPrivate();
      const result = await generate({ loadResume, dryRun: true, cvDir: cv, privateFile });
      created.push(dirname(result.file));
      expect(parts(result.file).body).not.toContain(PHONE);
    });
  });
});
