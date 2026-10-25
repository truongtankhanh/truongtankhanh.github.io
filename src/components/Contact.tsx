import { Fragment } from 'react';
import type { Resume } from '../content/types';
import { CV_PATH } from '../routes';
import { displayUrl } from '../lib/urls';
import { EmailLink } from './EmailLink';
import { Icon, type IconName } from './Icon';

function Tile({
  href,
  name,
  note,
  icon,
  download,
}: {
  href: string;
  name: string;
  note: string;
  icon: IconName;
  download?: string;
}) {
  return (
    <a className="tile" href={href} download={download}>
      <span className="tile-name">{name}</span>
      <span className="tile-note">
        {/* A browser does not break a line after "/", so say where it may: the note then wraps between words, not inside one. */}
        {note.split('/').map((part, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <>
                /<wbr />
              </>
            )}
            {part}
          </Fragment>
        ))}
      </span>
      <Icon name={icon} className="icon tile-icon" />
    </a>
  );
}

/** The closing band: the email is the one primary action, GitHub, LinkedIn and the CV are quieter tiles. */
export function Contact({ resume: r }: { resume: Resume }) {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      {/* The top edge is a wave in the colour of the section above. */}
      <svg
        className="wave-top"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 0 H1440 V14 C1200 46 960 4 720 28 S240 44 0 14 Z" />
      </svg>
      <div className="contact-inner">
        <div className="contact-copy">
          <h2 id="contact-title">Let’s talk</h2>
          <p>
            {r.availability}. Email is the quickest way to reach me; I work in {r.timezone}.
          </p>
        </div>
        <div className="contact-actions">
          <EmailLink
            email={r.email}
            label="Email me"
            copiedLabel="Copied to clipboard"
            className="mail-card"
            labelClassName="mail-label"
          >
            <b>{r.email}</b>
            <Icon name="arrowUpRight" className="icon mail-icon" />
          </EmailLink>
          <div className="link-tiles">
            <Tile href={r.links.github} name="GitHub" note={displayUrl(r.links.github)} icon="arrowUpRight" />
            <Tile
              href={r.links.linkedin}
              name="LinkedIn"
              note={displayUrl(r.links.linkedin)}
              icon="arrowUpRight"
            />
            <Tile href={r.cv.pdf} name="Download CV" note="PDF" icon="download" download={r.cv.fileName} />
          </div>
          {/* The one place that offers the CV page to print: the header keeps a single, primary CV action. */}
          <p className="contact-print">
            <a className="btn-text btn-on-band" href={CV_PATH}>
              Print the CV
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
