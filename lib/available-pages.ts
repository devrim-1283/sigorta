// Available pages/modules that can be assigned to roles
export interface PagePermission {
  pageId: string
  pageName: string
  route: string
  permissions: {
    canView?: boolean
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canViewAll?: boolean
    canViewOwn?: boolean
    canExport?: boolean
  }
}

export const AVAILABLE_PAGES: PagePermission[] = [
  {
    pageId: "dashboard",
    pageName: "Dashboard",
    route: "/admin/dashboard",
    permissions: {
      canView: true,
    },
  },
  {
    pageId: "customer-management",
    pageName: "Müşteri Yönetimi",
    route: "/admin/musteriler",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewAll: true,
      canViewOwn: true,
      canExport: true,
    },
  },
  {
    pageId: "dealer-management",
    pageName: "Bayi Yönetimi",
    route: "/admin/bayiler",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewAll: true,
    },
  },
  {
    pageId: "document-management",
    pageName: "Evrak Yönetimi",
    route: "/admin/dokumanlar",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewAll: true,
      canViewOwn: true,
    },
  },
  {
    pageId: "accounting",
    pageName: "Muhasebe",
    route: "/admin/muhasebe",
    permissions: {
      canView: true,
      canEdit: true,
      canViewAll: true,
      canExport: true,
    },
  },
  {
    pageId: "reports",
    pageName: "Raporlar",
    route: "/admin/raporlar",
    permissions: {
      canView: true,
      canExport: true,
    },
  },
  {
    pageId: "notifications",
    pageName: "Bildirim Merkezi",
    route: "/admin/bildirimler",
    permissions: {
      canView: true,
    },
  },
  {
    pageId: "user-management",
    pageName: "Kullanıcı Yönetimi",
    route: "/admin/ayarlar/kullanicilar",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewAll: true,
    },
  },
  {
    pageId: "role-management",
    pageName: "Rol Yönetimi",
    route: "/admin/ayarlar/roller",
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
  },
  {
    pageId: "system-settings",
    pageName: "Sistem Ayarları",
    route: "/admin/ayarlar/sistem",
    permissions: {
      canView: true,
      canEdit: true,
    },
  },
]

