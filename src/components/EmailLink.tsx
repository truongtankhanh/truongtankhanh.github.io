import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';

interface EmailLinkProps {
  email: string;
  label: string;
  /** Shown for about two seconds after the address is copied. */
  copiedLabel: string;
  className?: string;
  icon?: IconName;
}

/**
 * A `mailto:` link that also copies the address. A visitor with only web mail has no mail app to open, so the
 * address lands on the clipboard; the default action is left alone so a visitor with a mail app still gets a draft.
 */
export function EmailLink({ email, label, copiedLabel, className, icon }: EmailLinkProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Blocked, or no clipboard outside a secure context: the mailto link still works.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <a className={className} href={`mailto:${email}`} onClick={copy}>
      {icon && <Icon name={icon} />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </a>
  );
}
