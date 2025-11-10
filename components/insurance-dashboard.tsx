"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Home,
  Menu,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  X,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  Download,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  RefreshCw,
  FolderOpen,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CustomersPage } from "@/components/customers-page" // Import CustomersPage component
import { RoleManagementPage } from "@/components/role-management-page" // Import RoleManagementPage component
import { UserManagementPage } from "@/components/user-management-page" // Import UserManagementPage component
import { DealerManagementPage } from "@/components/dealer-management-page" // Import DealerManagementPage component
import { DocumentManagementPage } from "@/components/document-management-page" // Added DocumentManagementPage import
import { SystemSettingsPage } from "@/components/system-settings-page" // Added SystemSettingsPage import
import { AccountingPage } from "@/components/accounting-page" // Added AccountingPage import
import { ReportsPage } from "@/components/reports-page" // Added ReportsPage import
import { NotificationsPage } from "@/components/notifications-page" // Added NotificationsPage import
import { PoliciesPage } from "@/components/policies-page" // Added PoliciesPage import
import { ClaimsPage } from "@/components/claims-page" // Added ClaimsPage import
import { getMenuItemsForRole, type UserRole } from "@/lib/role-config" // Added role-based menu config
import { useDashboard } from "@/hooks/useDashboard" // Import dashboard hook
import { useAuth } from "@/lib/auth-context" // Import auth context
import Link from "next/link"


const iconMap: Record<string, any> = {
  Home,
  Users,
  Building2,
  FileText, // Added FileText to map
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Shield,
  AlertTriangle,
  FolderOpen, // Added FolderOpen to map
}

interface InsuranceDashboardProps {
  onLogout?: () => void
  userRole?: UserRole
}

export function InsuranceDashboard({ onLogout, userRole = "superadmin" }: InsuranceDashboardProps) {
  const { user } = useAuth()
  const { stats, loading, error, refetch } = useDashboard()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const menuItems = getMenuItemsForRole(userRole, stats)

  // Update notification count from API
  const notificationCount = stats?.unread_notifications || 0

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-72 transform transition-all duration-300 ease-in-out md:block",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col backdrop-blur-xl" style={{ backgroundColor: "#0B3D91" }}>
          <div className="flex items-center gap-4 p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/oksijen-logo.png" alt="Şeffaf Danışmanlık Logo" className="h-10 w-auto" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white tracking-tight">Şeffaf Danışmanlık</h2>
              <p className="text-sm text-white/70 font-medium">Yönetim Sistemi v2.0</p>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 text-white/50 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Ara..."
                className="w-full rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-12 pr-4 py-3 font-medium backdrop-blur-sm focus:bg-white/15 transition-all"
              />
            </div>
          </div>

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
                      activeTab === item.route || (item.hasSubmenu && expandedMenus[item.id])
                        ? "text-white shadow-lg"
                        : "",
                    )}
                    style={{
                      backgroundColor:
                        activeTab === item.route || (item.hasSubmenu && expandedMenus[item.id])
                          ? "#F57C00"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="transition-transform group-hover:scale-110">{renderIcon(item.icon)}</div>
                      <span className="flex-1 text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <Badge
                          className="ml-auto rounded-2xl font-semibold px-3 py-1 shadow-sm"
                          style={{
                            backgroundColor: activeTab === item.route ? "#0B3D91" : "#F57C00",
                            color: "white",
                          }}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {item.hasSubmenu && (
                        <div className="ml-auto">
                          {expandedMenus[item.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                  ) : (
                    <Link href={item.route}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start rounded-2xl px-4 py-3 text-left font-medium text-white/90 hover:bg-slate-800/50 hover:text-white transition-all duration-200 group",
                          activeTab === item.route
                            ? "text-white shadow-lg"
                            : "",
                        )}
                        style={{
                          backgroundColor:
                            activeTab === item.route
                              ? "#F57C00"
                              : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="transition-transform group-hover:scale-110">{renderIcon(item.icon)}</div>
                          <span className="flex-1 text-sm font-semibold">{item.label}</span>
                          {item.badge && (
                            <Badge
                              className="ml-auto rounded-2xl font-semibold px-3 py-1 shadow-sm"
                              style={{
                                backgroundColor: activeTab === item.route ? "#0B3D91" : "#F57C00",
                                color: "white",
                              }}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    </Link>
                  )}
                  {item.hasSubmenu && expandedMenus[item.id] && item.submenu && (
                    <div className="ml-8 mt-2 space-y-2">
                      {item.submenu.map((subItem) => (
                        <Link key={subItem.id} href={subItem.route}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start rounded-xl px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-slate-800/50 hover:text-white transition-all",
                              activeTab === subItem.route ? "text-white bg-slate-800/50" : "",
                            )}
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

          <div className="p-6 border-t border-white/10">
            <div
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-800/30 transition-all cursor-pointer"
              style={{ backgroundColor: "#1e293b" }}
            >
              <Avatar className="h-10 w-10 ring-2 ring-white/20">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback style={{ backgroundColor: "#F57C00", color: "white" }} className="font-bold">
                  AY
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Admin User</p>
                <p className="text-xs text-slate-300 font-medium">admin@sigorta.com</p>
              </div>
              {onLogout && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ backgroundColor: "#0B3D91" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/oksijen-logo.png" alt="Şeffaf Danışmanlık Logo" className="h-8 w-auto" />
              <div>
                <h2 className="font-semibold text-white">Şeffaf Danışmanlık</h2>
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
          {/* Mobile sidebar content same as desktop */}
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                type="search"
                placeholder="Ara..."
                className="w-full rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-9 pr-4 py-2"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.hasSubmenu ? (
                    <Button
                      variant="ghost"
                      onClick={() => toggleSubmenu(item.id)}
                      className={cn(
                      "w-full justify-start rounded-2xl px-3 py-2 text-left font-normal text-white/90 hover:bg-slate-800/50 hover:text-white",
                      activeTab === item.route || (item.hasSubmenu && expandedMenus[item.id]) ? "text-white" : "",
                    )}
                    style={{
                      backgroundColor:
                        activeTab === item.route || (item.hasSubmenu && expandedMenus[item.id])
                          ? "#F57C00"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {renderIcon(item.icon)}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge
                          className="ml-auto rounded-xl text-xs"
                          style={{
                            backgroundColor: activeTab === item.route ? "#0B3D91" : "#F57C00",
                            color: "white",
                          }}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {item.hasSubmenu && (
                        <div className="ml-auto">
                          {expandedMenus[item.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                  ) : (
                    <Link href={item.route}>
                      <Button
                        variant="ghost"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "w-full justify-start rounded-2xl px-3 py-2 text-left font-normal text-white/90 hover:bg-slate-800/50 hover:text-white",
                          activeTab === item.route ? "text-white" : "",
                        )}
                        style={{
                          backgroundColor:
                            activeTab === item.route
                              ? "#F57C00"
                              : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {renderIcon(item.icon)}
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge
                              className="ml-auto rounded-xl text-xs"
                              style={{
                                backgroundColor: activeTab === item.route ? "#0B3D91" : "#F57C00",
                                color: "white",
                              }}
                            >
                              {item.badge}
                            </Badge>
                          )}
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
                              activeTab === subItem.route ? "text-white bg-slate-800/50" : "",
                            )}
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

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-2xl" style={{ backgroundColor: "#1e293b" }}>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback style={{ backgroundColor: "#F57C00", color: "white" }}>AY</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-slate-300">admin@oksijen.com</p>
              </div>
              {onLogout && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className={cn("transition-all duration-300", sidebarOpen ? "md:ml-72" : "md:ml-0")}>
        <header className="flex items-center justify-between border-b bg-white/80 backdrop-blur-xl px-6 py-4 shadow-sm">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
                Şeffaf Danışmanlık Yönetim Sistemi
              </h1>
              <p className="text-sm text-muted-foreground font-medium">Profesyonel Sigorta Çözümleri</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs font-bold"
                  style={{ backgroundColor: "#F57C00", color: "white" }}
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
            <Avatar className="h-9 w-9 ring-2 ring-slate-200">
              <AvatarImage src="/placeholder.svg?height=36&width=36" />
              <AvatarFallback style={{ backgroundColor: "#0B3D91", color: "white" }} className="font-bold">
                AY
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="w-full overflow-x-auto">
                <TabsList className="inline-flex w-auto min-w-full rounded-3xl p-2 bg-white shadow-lg border">
                  <TabsTrigger
                    value="dashboard"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="customer-management"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Müşteriler
                  </TabsTrigger>
                  <TabsTrigger
                    value="dealer-management"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Temsilciler
                  </TabsTrigger>
                  <TabsTrigger
                    value="policies"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Poliçeler
                  </TabsTrigger>
                  <TabsTrigger
                    value="claims"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Hasarlar
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Raporlar
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Bildirimler
                  </TabsTrigger>
                  <TabsTrigger
                    value="system-settings"
                    className="rounded-2xl font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white whitespace-nowrap"
                  >
                    Sistem Ayarları
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="hidden lg:flex gap-3 flex-shrink-0">
                <Button variant="outline" className="rounded-2xl bg-white border-2 font-semibold hover:bg-slate-50">
                  <Download className="mr-2 h-4 w-4" />
                  Rapor İndir
                </Button>
                <Button
                  className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: "#F57C00", color: "white" }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Poliçe
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <TabsContent value="dashboard" className="space-y-10 mt-0">
                  {/* Dashboard Header with Refresh */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
                        Dashboard
                      </h2>
                      <p className="text-muted-foreground font-medium mt-1">
                        {loading ? 'Yükleniyor...' : 'Sistem istatistikleri ve genel bakış'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={refetch}
                      disabled={loading}
                      className="rounded-2xl bg-white border-2 font-semibold hover:bg-slate-50"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Yenile
                    </Button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <Card className="rounded-3xl border-2 border-red-200 bg-red-50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 text-red-800">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium">{error}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Dashboard Overview Cards */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                            style={{ backgroundColor: "#0B3D91" }}
                          >
                            <Users className="h-7 w-7 text-white" />
                          </div>
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold tracking-tight">
                            {loading ? '...' : (stats?.total_customers || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground font-semibold">Toplam Müşteri</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg"
                            style={{ backgroundColor: "#F57C00" }}
                          >
                            <Building2 className="h-7 w-7 text-white" />
                          </div>
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold tracking-tight">
                            {loading ? '...' : (stats?.total_dealers || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground font-semibold">Toplam Temsilci</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 shadow-lg">
                            <FileText className="h-7 w-7 text-white" />
                          </div>
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold tracking-tight">
                            {loading ? '...' : (stats?.total_documents || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground font-semibold">Toplam Evrak</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-600 shadow-lg">
                            <CreditCard className="h-7 w-7 text-white" />
                          </div>
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-3xl font-bold tracking-tight">
                            {loading ? '...' : (stats?.total_payments || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground font-semibold">Toplam Ödeme</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Customers */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
                          Son Müşteriler
                        </h2>
                        <p className="text-muted-foreground font-medium mt-1">En son eklenen müşteri başvuruları</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="rounded-2xl font-semibold hover:bg-slate-100"
                        onClick={() => setActiveTab('customer-management')}
                      >
                        Tümünü Gör
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                      {loading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, index) => (
                          <Card key={`skeleton-${index}`} className="rounded-3xl border-2 shadow-lg bg-gradient-to-br from-white to-slate-50">
                            <CardContent className="p-6 space-y-4">
                              <div className="animate-pulse">
                                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="space-y-2">
                                  <div className="h-3 bg-gray-200 rounded"></div>
                                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : stats?.recent_customers && stats.recent_customers.length > 0 ? (
                        stats.recent_customers.map((customer) => (
                          <Card
                            key={customer.id}
                            className="rounded-3xl border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-slate-50"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <Badge
                                  className="rounded-2xl font-semibold px-3 py-1 bg-blue-100 text-blue-800"
                                >
                                  {customer.dosya_turu}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-2xl hover:bg-slate-100"
                                  onClick={() => setActiveTab('customer-management')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h3 className="font-bold text-lg tracking-tight">{customer.ad_soyad}</h3>
                                <p className="text-sm text-muted-foreground font-semibold">{customer.telefon}</p>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground font-medium">Dosya ID:</span>
                                  <span className="font-bold">#{customer.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground font-medium">Tarih:</span>
                                  <span className="font-bold">
                                    {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">Henüz müşteri kaydı bulunmuyor</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Recent Documents */}
                  {stats?.recent_documents && stats.recent_documents.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
                            Son Evraklar
                          </h2>
                          <p className="text-muted-foreground font-medium mt-1">En son yüklenen belgeler</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="rounded-2xl font-semibold hover:bg-slate-100"
                          onClick={() => setActiveTab('document-management')}
                        >
                          Tümünü Gör
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {stats.recent_documents.map((doc) => (
                          <Card
                            key={doc.id}
                            className="rounded-2xl border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-slate-50"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
                                    style={{ backgroundColor: "#0B3D91" }}
                                  >
                                    <FileText className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg tracking-tight">{doc.belge_adi}</h3>
                                    <p className="text-sm text-muted-foreground font-semibold">
                                      {doc.musteri_ad} • {doc.tur}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    className={cn(
                                      "rounded-xl font-semibold px-3 py-1",
                                      doc.durum === "Onaylı"
                                        ? "bg-green-100 text-green-800"
                                        : doc.durum === "Beklemede"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {doc.durum}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="customer-management" className="space-y-6 mt-0">
                  <CustomersPage userRole={userRole} />
                </TabsContent>

                <TabsContent value="dealer-management" className="space-y-6 mt-0">
                  <DealerManagementPage />
                </TabsContent>

                <TabsContent value="role-management" className="space-y-6 mt-0">
                  <RoleManagementPage currentUserRole={userRole === "superadmin" ? "superadmin" : "user"} />
                </TabsContent>

                <TabsContent value="user-management" className="space-y-6 mt-0">
                  <UserManagementPage />
                </TabsContent>

                <TabsContent value="document-management" className="space-y-6 mt-0">
                  <DocumentManagementPage userRole={userRole} />
                </TabsContent>

                <TabsContent value="accounting" className="space-y-6 mt-0">
                  <AccountingPage userRole={userRole} />
                </TabsContent>

                <TabsContent value="reports" className="space-y-6 mt-0">
                  <ReportsPage userRole={userRole} />
                </TabsContent>

                <TabsContent value="policies" className="space-y-6 mt-0">
                  <PoliciesPage />
                </TabsContent>

                <TabsContent value="claims" className="space-y-6 mt-0">
                  <ClaimsPage />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6 mt-0">
                  <NotificationsPage userRole={userRole} />
                </TabsContent>

                <TabsContent value="system-settings" className="space-y-6 mt-0">
                  <SystemSettingsPage />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
