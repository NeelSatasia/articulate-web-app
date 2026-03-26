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
    SidebarMenuSub,
    SidebarMenuSubItem
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
                                    <Link to="/wordbank">Commonplace Book</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-sm">
                                    <Link to="/vocabulary">Vocabulary</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <Collapsible defaultOpen className="group/collapsible">
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            Playground
                                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuButton asChild>
                                                    <Link to="/sentence-crafting">Sentence Crafting</Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuSubItem>

                                            <SidebarMenuSubItem>
                                                <SidebarMenuButton asChild>
                                                    <Link to="/vocabulary-recall">Vocabulary Recall</Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuSubItem>

                                            <SidebarMenuSubItem>
                                                <SidebarMenuButton asChild>
                                                    <Link to="/essence-writing">Essence Writing</Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuSubItem>

                                            <SidebarMenuSubItem>
                                                <SidebarMenuButton asChild>
                                                    <Link to="/free-writing">Free Writing</Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </Collapsible>
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
                
                <Button key="logout-btn" className="bg-red-600 hover:bg-red-500" size="sm" onClick={logoutUser}>Logout</Button>
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar