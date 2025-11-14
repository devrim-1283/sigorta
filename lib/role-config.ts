// Role-based menu configuration
// Each role sees different menu labels and has different data access

export type UserRole = "superadmin" | "birincil-admin" | "ikincil-admin" | "evrak-birimi" | "bayi" | "musteri" | "operasyon" | "admin"

export interface MenuItem {
  id: string // Internal module ID
  label: string // Display label for this role
  icon: string
  route: string
  badge?: string
  hasSubmenu?: boolean
  submenu?: MenuItem[]
  permissions?: {
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canViewAll?: boolean
    canViewOwn?: boolean
    canExport?: boolean
  }
}

export interface RoleConfig {
  role: UserRole
  displayName: string
  menuItems: MenuItem[]
}

// Role configurations
export const roleConfigs: Record<UserRole, RoleConfig> = {
  superadmin: {
    role: "superadmin",
    displayName: "Süper Admin",
    menuItems: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "Home",
        route: "/admin/dashboard",
      },
      {
        id: "customer-management",
        label: "Müşteri Yönetimi",
        icon: "Users",
        route: "/admin/musteriler",
        permissions: {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewAll: true,
          canExport: true,
        },
      },
      {
        id: "dealer-management",
        label: "Bayi Yönetimi",
        icon: "Building2",
        route: "/admin/bayiler",
        permissions: {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewAll: true,
        },
      },
      {
        id: "document-management",
        label: "Evrak Yönetimi",
        icon: "FileText",
        route: "/admin/dokumanlar",
        permissions: {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewAll: true,
        },
      },
      {
        id: "accounting",
        label: "Muhasebe",
        icon: "CreditCard",
        route: "/admin/muhasebe",
        permissions: {
          canViewAll: true,
          canExport: true,
        },
      },
      {
        id: "reports",
        label: "Raporlar",
        icon: "BarChart3",
        route: "/admin/raporlar",
      },
      {
        id: "notifications",
        label: "Bildirim Merkezi",
        icon: "Bell",
        route: "/admin/bildirimler",
      },
      {
        id: "sms-management",
        label: "SMS Yönetimi",
        icon: "MessageSquare",
        route: "/admin/sms",
        permissions: {
          canViewAll: true,
          canCreate: true,
        },
      },
      {
        id: "audit-logs",
        label: "Sistem Logları",
        icon: "Activity",
        route: "/admin/loglar",
        permissions: {
          canViewAll: true,
        },
      },
      {
        id: "settings",
        label: "Genel Ayarlar",
        icon: "Settings",
        route: "/admin/ayarlar",
        hasSubmenu: true,
        submenu: [
          {
            id: "user-management",
            label: "Kullanıcı Yönetimi",
            icon: "Users",
            route: "/admin/ayarlar/kullanicilar",
          },
          {
            id: "role-management",
            label: "Rol Yönetimi",
            icon: "Shield",
            route: "/admin/ayarlar/roller",
          },
          {
            id: "system-settings",
            label: "Sistem Ayarları",
            icon: "Settings",
            route: "/admin/ayarlar/sistem",
          },
        ],
      },
    ],
  },
  "birincil-admin": {
    role: "birincil-admin",
    displayName: "Birincil Admin",
    menuItems: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "Home",
        route: "/admin/dashboard",
      },
      {
        id: "customer-management",
        label: "Müşteri Yönetimi",
        icon: "Users",
        route: "/admin/musteriler",
        permissions: {
          canCreate: true,
          canEdit: true,
          canViewAll: true,
          canExport: true,
        },
      },
      {
        id: "dealer-management",
        label: "Bayi Yönetimi",
        icon: "Building2",
        route: "/admin/bayiler",
        permissions: {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canViewAll: true,
        },
      },
      {
        id: "document-management",
        label: "Evrak Yönetimi",
        icon: "FileText",
        route: "/admin/dokumanlar",
        permissions: {
          canCreate: true,
          canEdit: true,
          canViewAll: true,
        },
      },
      {
        id: "accounting",
        label: "Muhasebe",
        icon: "CreditCard",
        route: "/admin/muhasebe",
        permissions: {
          canViewAll: true,
          canEdit: true,
          canExport: true,
        },
      },
      {
        id: "reports",
        label: "Raporlar",
        icon: "BarChart3",
        route: "/admin/raporlar",
      },
      {
        id: "notifications",
        label: "Bildirim Merkezi",
        icon: "Bell",
        route: "/admin/bildirimler",
      },
    ],
  },
  "ikincil-admin": {
    role: "ikincil-admin",
    displayName: "İkincil Admin",
    menuItems: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "Home",
        route: "/admin/dashboard",
      },
      {
        id: "customer-management",
        label: "Müşteri Yönetimi",
        icon: "Users",
        route: "/admin/musteriler",
        permissions: {
          canCreate: false,
          canEdit: true,
          canViewAll: true,
        },
      },
      {
        id: "document-management",
        label: "Sonuç Evrakları",
        icon: "FileText",
        route: "/admin/dokumanlar",
        permissions: {
          canCreate: true,
          canEdit: true,
          canViewAll: true,
        },
      },
      {
        id: "notifications",
        label: "Bildirim Merkezi",
        icon: "Bell",
        route: "/admin/bildirimler",
      },
    ],
  },
  "evrak-birimi": {
    role: "evrak-birimi",
    displayName: "Evrak Birimi",
    menuItems: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "Home",
        route: "/admin/dashboard",
      },
      {
        id: "customer-management",
        label: "Müşteri Yönetimi",
        icon: "Users",
        route: "/admin/musteriler",
        permissions: {
          canCreate: true,
          canEdit: false,
          canViewAll: true,
        },
      },
      {
        id: "document-management",
        label: "Evrak Yönetimi",
        icon: "FileText",
        route: "/admin/dokumanlar",
        permissions: {
          canCreate: true,
          canViewAll: true,
        },
      },
      {
        id: "notifications",
        label: "Bildirimler",
        icon: "Bell",
        route: "/admin/bildirimler",
      },
    ],
  },
  bayi: {
    role: "bayi",
    displayName: "Bayi",
    menuItems: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "Home",
        route: "/admin/dashboard",
      },
      {
        id: "customer-management",
        label: "Müşterilerim",
        icon: "Users",
        route: "/admin/musteriler",
        permissions: {
          canCreate: false,
          canEdit: false,
          canViewOwn: true,
        },
      },
      {
        id: "document-management",
        label: "Evraklarım",
        icon: "FileText",
        route: "/admin/dokumanlar",
        permissions: {
          canViewOwn: true,
        },
      },
      {
        id: "notifications",
        label: "Bildirimler",
        icon: "Bell",
        route: "/admin/bildirimler",
      },
    ],
  },
  musteri: {
    role: "musteri",
    displayName: "Müşteri",
    menuItems: [
      {
        id: "customer-management",
        label: "Durumum",
        icon: "FileText",
        route: "/admin/musteriler",
        permissions: {
          canViewOwn: true,
        },
      },
      {
        id: "notifications",
        label: "Bildirimler",
        icon: "Bell",
        route: "/admin/bildirimler",
      },
    ],
  },
}

// Helper function to get menu items for a specific role with dynamic badges
export function getMenuItemsForRole(role: UserRole, stats?: any): MenuItem[] {
  const menuItems = roleConfigs[role]?.menuItems || []

  // Update badges with real stats if available
  return menuItems.map(item => {
    // Update customer-management badge with active customers (excluding closed files)
    if (item.id === "customer-management" && stats?.active_customers !== undefined) {
      return { ...item, badge: stats.active_customers.toString() }
    }
    // Update dealer-management badge with active dealers
    if (item.id === "dealer-management" && stats?.total_dealers !== undefined) {
      return { ...item, badge: stats.total_dealers.toString() }
    }
    // Update accounting badge with pending payments count
    if (item.id === "accounting" && stats?.pending_payments !== undefined) {
      const pendingCount = typeof stats.pending_payments === 'number' 
        ? stats.pending_payments 
        : parseInt(stats.pending_payments) || 0
      return { ...item, badge: pendingCount > 0 ? pendingCount.toString() : undefined }
    }
    // Update notifications badge with unread notifications count
    if (item.id === "notifications" && stats?.unread_notifications !== undefined) {
      const notificationCount = typeof stats.unread_notifications === 'number'
        ? stats.unread_notifications
        : parseInt(stats.unread_notifications) || 0
      // Only show badge if there are unread notifications
      return { ...item, badge: notificationCount > 0 ? notificationCount.toString() : undefined }
    }
    return item
  })
}

// Helper function to check if user has permission for a specific action
export function hasPermission(
  role: UserRole,
  moduleId: string,
  action: keyof NonNullable<MenuItem["permissions"]>,
): boolean {
  const config = roleConfigs[role]
  const menuItem = config?.menuItems.find((item) => item.id === moduleId)
  return menuItem?.permissions?.[action] || false
}

// Helper function to get display label for a module based on role
export function getModuleLabel(role: UserRole, moduleId: string): string {
  const config = roleConfigs[role]
  const menuItem = config?.menuItems.find((item) => item.id === moduleId)
  return menuItem?.label || moduleId
}