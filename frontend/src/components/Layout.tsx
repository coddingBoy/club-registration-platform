import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

function Layout({ children }: LayoutProps) {
  return (
    <div className="site-shell">
      <header className="club-header">
        <div className="header-inner">
          <div className="club-mark" aria-hidden="true">
            CTS
          </div>
          <div>
            <p className="header-kicker">Cape Town Spurs Academy</p>
            <h1>Registration System</h1>
          </div>
        </div>
      </header>
      <main className="foundation-layout">{children}</main>
    </div>
  );
}

export default Layout;
