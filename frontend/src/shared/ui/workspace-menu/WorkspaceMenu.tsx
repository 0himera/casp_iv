'use client';

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import styles from './WorkspaceMenu.module.css';

const MenuContext = createContext<{ active: string | null; setActive: (id: string | null) => void }>({ active: null, setActive: () => {} });
export function WorkspaceMenus({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  return <MenuContext value={{ active, setActive }}>{children}</MenuContext>;
}
function useMenu() {
  const id = useId();
  const { active, setActive } = useContext(MenuContext);
  const anchor = useRef<HTMLButtonElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const open = active === id;
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target) && !surface.current?.contains(event.target)) setActive(null);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setActive(null); anchor.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, setActive]);
  return { id, open, anchor, surface, show: () => setActive(id), close: () => setActive(null), toggle: () => setActive(open ? null : id) };
}
function Surface({ anchor, surface, children, minWidth, id, role, label }: {
  anchor: RefObject<HTMLButtonElement | null>; surface: RefObject<HTMLDivElement | null>;
  children: ReactNode; minWidth: number; id: string; role?: 'listbox' | 'group'; label: string;
}) {
  useLayoutEffect(() => {
    const position = () => {
      const button = anchor.current, menu = surface.current;
      if (!button || !menu) return;
      const rect = button.getBoundingClientRect();
      const width = Math.min(innerWidth - 24, Math.max(rect.width, minWidth));
      menu.style.width = `${width}px`;
      const below = innerHeight - rect.bottom - 20, above = rect.top - 20;
      const height = Math.min(menu.scrollHeight, 340, Math.max(below, above));
      menu.style.maxHeight = `${Math.max(80, height)}px`;
      menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
      menu.style.top = `${Math.max(12, below >= height || below >= above ? rect.bottom + 8 : rect.top - height - 8)}px`;
      menu.style.visibility = 'visible';
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => { window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [anchor, surface, minWidth]);
  return createPortal(<div ref={surface} id={id} role={role} aria-label={label} className={styles.surface}>{children}</div>, document.body);
}
export function WorkspacePopover({ label, trigger, children, className, minWidth = 250 }: {
  label: string; trigger: ReactNode; children: ReactNode; className?: string; minWidth?: number;
}) {
  const { id, open, anchor: anchorRef, surface: surfaceRef, toggle } = useMenu();
  useEffect(() => {
    if (open) surfaceRef.current?.querySelector<HTMLElement>('input, button, a[href]')?.focus();
  }, [open, surfaceRef]);
  return <><button ref={anchorRef} type="button" className={className} aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}>{trigger}</button>
    {open && <Surface anchor={anchorRef} surface={surfaceRef} id={id} minWidth={minWidth} role="group" label={label}><div className={styles.content}>{children}</div></Surface>}
  </>;
}
export function WorkspaceSelect({ label, value, options, onChange, minWidth = 220 }: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (value: string) => void; minWidth?: number;
}) {
  const { id, open, anchor: anchorRef, surface: surfaceRef, show, close, toggle } = useMenu();
  const [active, setActive] = useState(0);
  const search = useRef({ text: '', at: 0 });
  const selected = Math.max(0, options.findIndex((o) => o.value === value));
  const choose = (index: number) => { if (options[index]) onChange(options[index].value); close(); anchorRef.current?.focus(); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const count = options.length;
    if (!count) return;
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : !open ? selected : (active + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
      setActive(next); show();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active); else { setActive(selected); show(); }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const text = (Date.now() - search.current.at < 700 ? search.current.text : '') + event.key.toLocaleLowerCase();
      search.current = { text, at: Date.now() };
      const index = options.findIndex((o) => o.label.toLocaleLowerCase().startsWith(text));
      if (index >= 0) { setActive(index); show(); }
    }
  };
  useEffect(() => { if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, open, id]);
  return <><button ref={anchorRef} type="button" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} aria-activedescendant={open ? `${id}-${active}` : undefined}
    disabled={!options.length} className={styles.select} title={options[selected]?.label} onKeyDown={keyDown} onClick={() => { setActive(selected); toggle(); }}>
    <span>{options[selected]?.label ?? 'Нет отправок'}</span><ChevronDown size={15} />
  </button>{open && <Surface anchor={anchorRef} surface={surfaceRef} id={id} minWidth={minWidth} role="listbox" label={label}>
    {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value === value} className={`${styles.option} ${active === index ? styles.active : ''}`}
      onPointerDown={(event) => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}><span>{option.label}</span>{option.value === value && <Check size={15} />}</div>)}
  </Surface>}</>;
}
