import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { falseStr, isAuth, userName } from "../commons"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { ChevronDown } from "lucide-react"

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
                                    <Link to="/wordbank">Word Bank</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-sm">
                                    <Link to="/vocabulary">Vocabulary</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <Collapsible defaultOpen className="group/collapsible">
                                    <SidebarGroup className="pl-0 pt-0 pb-0">
                                        <SidebarGroupLabel asChild className="text-sm pl-0">
                                            <CollapsibleTrigger className="mt-0">
                                                <SidebarMenuButton>
                                                Train
                                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarGroupLabel>

                                        <CollapsibleContent className="ml-2">
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild className="text-sm">
                                                    <Link to="/rewritephrases">Rewrite Phrases</Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        </CollapsibleContent>
                                    </SidebarGroup>
                                </Collapsible>
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