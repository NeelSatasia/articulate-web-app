import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { falseStr, isAuth, userName } from "../commons"

const AppSidebar = () => {

    const logoutUser = async () => {
            try {
                localStorage.setItem(isAuth, falseStr)
                window.location.href = "http://localhost:8000/auth/logout"
                
            } catch(error) {
                console.error("Error logging user out", error)
            }
        }

    return (
        <Sidebar>
            <SidebarHeader>
                <h1>{localStorage.getItem(userName)}</h1>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to="/dashboard">Dashboard</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to="/wordbank">Word Bank</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to="/vocabulary">Vocabulary</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <Button key="logout-btn" className="bg-red-700 hover:bg-red-400" onClick={logoutUser}>Logout</Button>
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar