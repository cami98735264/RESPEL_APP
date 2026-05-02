import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { NotificationBell } from "./NotificationBell";
import { GeneratorProvider } from "./GeneratorContext";

export function AppShell() {
  return (
    <GeneratorProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar leading={<MobileNav />} actions={<NotificationBell />} />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </GeneratorProvider>
  );
}
