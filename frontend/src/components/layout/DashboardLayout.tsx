import type { ReactNode } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div>
          <h1>Dev Asset Inspector</h1>
          <p>Analyze and optimize your project assets</p>
        </div>
      </header>

      <main className="dashboard-content">{children}</main>
    </div>
  );
}
