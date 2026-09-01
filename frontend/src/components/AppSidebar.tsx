import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { falseStr, isAuth, userName } from "../commons"
import { backendServiceURL } from "../commons"


const AppSidebar = () => {

    const logoutUser = async () => {
            try {
                localStorage.setItem(isAuth, falseStr)
                window.location.href = `${backendServiceURL}/auth/logout`
                
            } catch(error) {
                console.error("Error logging user out", error)
            }
        }

    return (
        <Sidebar>
            <SidebarTrigger className="absolute right-[-30px] top-0 z-50" />
            
            <SidebarHeader className="flex flex-col items-center justify-center gap-y-2">
                <h1 className="text-4xl">{localStorage.getItem(userName)}</h1>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-sm">
                                    <Link to="/dashboard">Dashboard</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-sm">
                                    <Link to="/wordbank">Your Word Bank</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-sm">
                        <Link to="/settings">Settings</Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                <Button key="logout-btn" className="bg-red-500 hover:bg-red-400" size="sm" onClick={logoutUser}>Logout</Button>
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar