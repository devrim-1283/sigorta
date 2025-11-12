"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getMenuItemsForRole, type UserRole } from "@/lib/role-config"
import { dashboardApi } from "@/lib/api-client"
import {
  Home,
  Users,
  Building2,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Search,
  X,
  Menu,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react"
import Link from "next/link"

// Force dynamic rendering to avoid static generation with useContext
export const dynamic = 'force-dynamic'

const iconMap: Record<string, any> = {
  Home,
  Users,
  Building2,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Shield,
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [stats, setStats] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Theme color based on role
  const themeColor = userRole === 'bayi' ? '#F57C00' : '#0B3D91'

  const allMenuItems = getMenuItemsForRole(userRole, stats)
  
  // Filter menu items based on search term
  const menuItems = searchTerm.trim() 
    ? allMenuItems.filter(item => {
        const labelMatch = item.label.toLowerCase().includes(searchTerm.toLowerCase())
        const submenuMatch = item.submenu?.some(sub => 
          sub.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return labelMatch || submenuMatch
      })
    : allMenuItems

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Home className="h-5 w-5" />
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }

    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div
        className={cn(
          "fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-slate-200 hidden md:flex",
          sidebarOpen ? "w-64" : "w-20"
        )}
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex h-full flex-col">
          {/* Header - Logo removed, just menu toggle */}
          <div className="flex items-center justify-end p-4 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/10 hidden md:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          {sidebarOpen && (
            <div className="px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Menü ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-9 pr-4 py-2 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.hasSubmenu ? (
                    <Button
                      variant="ghost"
                      onClick={() => toggleSubmenu(item.id)}
                      className={cn(
                        "w-full justify-start rounded-2xl px-4 py-3 text-left font-medium text-white/90 hover:bg-slate-800/50 hover:text-white transition-all duration-200 group",
                        "w-full",
                        !sidebarOpen && "justify-center px-2 py-3"
                      )}
                    >
                      <div className={cn(
                        "flex items-center w-full",
                        !sidebarOpen ? "justify-center" : "gap-4"
                      )}>
                        <div className="transition-transform group-hover:scale-110">{renderIcon(item.icon)}</div>
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-sm font-semibold">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto rounded-2xl font-semibold px-2 py-1 text-xs bg-white/20 text-white">
                                {item.badge}
                              </span>
                            )}
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform",
                              expandedMenus[item.id] ? "rotate-180" : ""
                            )} />
                          </>
                        )}
                      </div>
                    </Button>
                  ) : (
                    <Link href={item.route}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-2xl px-4 py-3 text-left font-medium text-white/90 hover:bg-slate-800/50 hover:text-white transition-all duration-200 group",
                          !sidebarOpen && "justify-center px-2 py-3",
                          "data-[active=true]:bg-[#F57C00] data-[active=true]:text-white data-[active=true]:hover:bg-[#F57C00]/90"
                        )}
                        data-active={pathname === item.route}
                      >
                        <div className={cn(
                          "flex items-center w-full",
                          !sidebarOpen ? "justify-center" : "gap-4"
                        )}>
                          <div className="transition-transform group-hover:scale-110">{renderIcon(item.icon)}</div>
                          {sidebarOpen && (
                            <>
                              <span className="flex-1 text-sm font-semibold">{item.label}</span>
                              {item.badge && (
                                <span className="ml-auto rounded-2xl font-semibold px-2 py-1 text-xs bg-white/20 text-white">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </Button>
                    </Link>
                  )}
                  {item.hasSubmenu && expandedMenus[item.id] && sidebarOpen && item.submenu && (
                    <div className="ml-8 mt-2 space-y-2">
                      {item.submenu.map((subItem) => (
                        <Link key={subItem.id} href={subItem.route}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start rounded-xl px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-slate-800/50 hover:text-white transition-all",
                              "data-[active=true]:bg-[#F57C00] data-[active=true]:text-white data-[active=true]:hover:bg-[#F57C00]/90"
                            )}
                            data-active={pathname === subItem.route}
                          >
                            {subItem.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-2xl bg-slate-800/50",
              !sidebarOpen && "justify-center"
            )}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-[#F57C00] text-white text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-300 truncate">
                    {user?.email || "admin@sigorta.com"}
                  </p>
                </div>
              )}
              {sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded-lg flex-shrink-0"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-slate-800">Sigorta Yönetim</h1>
          <Button
            onClick={() => setMobileMenuOpen(true)}
            variant="ghost"
            size="icon"
            className="rounded-xl"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/oksijen-logo.png" alt="Logo" className="h-8 w-auto" />
              <div>
                <h2 className="font-semibold text-white">Sigorta</h2>
                <p className="text-xs text-white/70">Yönetim Sistemi</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.hasSubmenu ? (
                    <Button
                      variant="ghost"
                      onClick={() => toggleSubmenu(item.id)}
                      className={cn(
                        "w-full justify-start rounded-2xl px-3 py-2 text-left font-normal text-white/90 hover:bg-slate-800/50 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {renderIcon(item.icon)}
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          expandedMenus[item.id] ? "rotate-180" : ""
                        )} />
                      </div>
                    </Button>
                  ) : (
                    <Link href={item.route}>
                      <Button
                        variant="ghost"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "w-full justify-start rounded-2xl px-3 py-2 text-left font-normal text-white/90 hover:bg-slate-800/50 hover:text-white",
                          "data-[active=true]:bg-[#F57C00] data-[active=true]:text-white data-[active=true]:hover:bg-[#F57C00]/90"
                        )}
                        data-active={pathname === item.route}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {renderIcon(item.icon)}
                          <span className="flex-1">{item.label}</span>
                        </div>
                      </Button>
                    </Link>
                  )}
                  {item.hasSubmenu && expandedMenus[item.id] && item.submenu && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link key={subItem.id} href={subItem.route}>
                          <Button
                            variant="ghost"
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "w-full justify-start rounded-xl px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-slate-800/50 hover:text-white",
                              "data-[active=true]:bg-[#F57C00] data-[active=true]:text-white data-[active=true]:hover:bg-[#F57C00]/90"
                            )}
                            data-active={pathname === subItem.route}
                          >
                            {subItem.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64" : "md:ml-20",
        "pt-16 md:pt-0" // Padding for mobile header
      )}>
        {children}
      </div>
    </div>
  )
}