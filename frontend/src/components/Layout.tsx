import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "./AppSidebar"
import { ThesaurusSearch } from "./ThesaurusSearch"
import { useState } from "react"


export default function Layout() {
  const [isThesaurusOpen, setIsThesaurusOpen] = useState<boolean>(false)

  return (
    <SidebarProvider>
      <AppSidebar
        isThesaurusOpen={isThesaurusOpen}
        onToggleThesaurus={() => setIsThesaurusOpen(prev => !prev)}
      />
      <main className="flex-1">
        <SidebarTrigger />
        <Outlet />
      </main>
      <ThesaurusSearch isOpen={isThesaurusOpen} />
    </SidebarProvider>
  )
}