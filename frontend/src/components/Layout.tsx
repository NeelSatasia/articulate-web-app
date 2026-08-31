import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "./AppSidebar"


export default function Layout() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  )
}