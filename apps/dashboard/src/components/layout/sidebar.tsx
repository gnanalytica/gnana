"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Play,
  Plug,
  Settings,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarItem } from "./sidebar-item";
import { ThemeToggle } from "./theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { UserMenu } from "./user-menu";

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: Play, label: "Runs", href: "/runs" },
  { icon: Plug, label: "Connectors", href: "/connectors" },
  { icon: Settings, label: "Settings", href: "/settings" },
] as const;

/** Mobile navigation link used inside the Sheet drawer. */
function MobileNavItem({
  icon: Icon,
  label,
  href,
  onNavigate,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isPinned) return;
    enterTimeoutRef.current = setTimeout(() => {
      setIsCollapsed(false);
    }, 150);
  }, [isPinned]);

  const handleMouseLeave = useCallback(() => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    if (!isPinned) {
      setIsCollapsed(true);
    }
  }, [isPinned]);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      if (prev) {
        // Unpinning — collapse the sidebar
        setIsCollapsed(true);
      }
      return !prev;
    });
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <TooltipProvider>
      {/* Desktop sidebar — hidden on mobile */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "hidden md:flex h-screen flex-col bg-card border-r border-border overflow-hidden transition-all duration-200 ease-in-out shrink-0",
          isCollapsed ? "w-12" : "w-[220px]",
        )}
      >
        {/* Workspace Switcher */}
        <WorkspaceSwitcher isCollapsed={isCollapsed} />

        {/* Navigation */}
        <nav
          className={cn("flex-1 flex flex-col gap-1 py-2", isCollapsed ? "items-center" : "px-2")}
        >
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn("shrink-0 pb-3", isCollapsed ? "px-1" : "px-2")}>
          <Separator className="mb-2" />
          <div className={cn("flex flex-col gap-1", isCollapsed ? "items-center" : "")}>
            <UserMenu isCollapsed={isCollapsed} />
            <ThemeToggle isCollapsed={isCollapsed} />

            {/* Pin/Unpin button — visible when expanded */}
            {!isCollapsed && (
              <button
                onClick={togglePin}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
                aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                {isPinned ? (
                  <PinOff className="h-4 w-4 shrink-0" />
                ) : (
                  <Pin className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{isPinned ? "Unpin" : "Pin"}</span>
              </button>
            )}

            {/* Collapse/Expand button — visible when pinned */}
            {isPinned && (
              <button
                onClick={toggleCollapse}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground",
                  isCollapsed ? "justify-center w-10 h-10" : "px-3 py-2",
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                )}
                {!isCollapsed && <span className="truncate">Collapse</span>}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile top bar + Sheet — hidden on desktop */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border bg-background z-50 flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Brand */}
              <div className="flex items-center h-14 px-4 shrink-0 border-b border-border">
                <span className="text-primary font-bold text-lg">&#x2B21; Gnana</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
                {navItems.map((item) => (
                  <MobileNavItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </nav>

              {/* Bottom section */}
              <div className="shrink-0 px-3 pb-4">
                <Separator className="mb-3" />
                <div className="flex flex-col gap-1">
                  <UserMenu isCollapsed={false} />
                  <ThemeToggle isCollapsed={false} />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-bold text-primary text-lg">&#x2B21; Gnana</span>
      </div>
    </TooltipProvider>
  );
}
