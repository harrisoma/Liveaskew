import type { ReactNode } from "react";

export function Shell({
  mark,
  title,
  links,
  children,
}: {
  mark: string;
  title: string;
  links: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="la-app">
      <header className="la-bar">
        <img className="la-mark" src={mark} alt="" />
        <div className="la-title">{title}</div>
        <nav className="la-nav">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="la-main">{children}</main>
    </div>
  );
}
