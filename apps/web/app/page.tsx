"use client";

import { Header } from "@/components/shell/Header";
import { StatsSidebar } from "@/components/shell/StatsSidebar";
import { TabContent } from "@/components/shell/TabContent";
import { MobileNav } from "@/components/shell/MobileNav";

export default function Home() {
  return (
    <div className="h-dvh flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <StatsSidebar />
        <TabContent />
      </div>
      <MobileNav />
    </div>
  );
}
