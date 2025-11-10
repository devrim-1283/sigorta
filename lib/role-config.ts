// Role-based menu configuration
// Each role sees different menu labels and has different data access

export type UserRole = "superadmin" | "birincil-admin" | "ikincil-admin" | "evrak-birimi" | "bayi" | "musteri"

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
        badge: "156",
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
        badge: "12",
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
        badge: "3",
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
        badge: "5",
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
        badge: "156",
        permissions: {
          canCreate: true,
          canEdit: true,
          canViewAll: true,
          canExport: true,
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
        badge: "3",
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
        badge: "5",
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
        badge: "156",
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
        badge: "3",
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
        label: "Dosya Yönetimi",
        icon: "FolderOpen",
        route: "/admin/musteriler",
        badge: "156",
        permissions: {
          canCreate: true,
          canEdit: false,
          canViewAll: true,
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
        badge: "2",
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
        badge: "24",
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
        badge: "2",
      },
    ],
  },
  musteri: {
    role: "musteri",
    displayName: "Müşteri",
    menuItems: [
      {
        id: "dashboard",
        label: "Ana Sayfa",
        icon: "Home",
        route: "/admin/dashboard",
      },
      {
        id: "customer-management",
        label: "Başvuru Durumum",
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
        badge: "1",
      },
    ],
  },
}

// Helper function to get menu items for a specific role with dynamic badges
export function getMenuItemsForRole(role: UserRole, stats?: any): MenuItem[] {
  const menuItems = roleConfigs[role]?.menuItems || []

  // Update badges with real stats if available
  return menuItems.map(item => {
    if (item.id === "customer-management" && stats?.total_customers !== undefined) {
      return { ...item, badge: stats.total_customers.toString() }
    }
    if (item.id === "dealer-management" && stats?.total_dealers !== undefined) {
      return { ...item, badge: stats.total_dealers.toString() }
    }
    if (item.id === "accounting" && stats?.total_payments !== undefined) {
      return { ...item, badge: stats.total_payments.toString() }
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