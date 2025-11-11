"use client"
import { FileText, Download, Eye, Trash2, Upload, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/role-config"

export type DocumentType = "Kimlik" | "Ruhsat" | "Kaza Fotoğrafları" | "Vekaletname" | "Diğer" | string
export type DocumentStatus = "Onaylandı" | "Beklemede" | "Reddedildi" | "Eksik"

export interface DocumentData {
  id: string
  tip: DocumentType
  dosya_adı: string
  yüklenme_tarihi?: string
  yükleyen?: string
  durum: DocumentStatus
  müşteri_adı?: string
  bayi_adı?: string
  dosya_yolu?: string
  mime_type?: string
}

interface DocumentCardProps {
  document: DocumentData
  userRole: UserRole
  canUpload?: boolean
  canDelete?: boolean
  showDealerInfo?: boolean
  onView?: (doc: DocumentData) => void
  onDownload?: (doc: DocumentData) => void
  onDelete?: (doc: DocumentData) => void
  onUpload?: (docType: DocumentType) => void
}

export function DocumentCard({
  document,
  userRole,
  canUpload = false,
  canDelete = false,
  showDealerInfo = false,
  onView,
  onDownload,
  onDelete,
  onUpload,
}: DocumentCardProps) {
  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "Onaylandı":
        return "bg-green-100 text-green-800 border-green-300"
      case "Beklemede":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Reddedildi":
        return "bg-red-100 text-red-800 border-red-300"
      case "Eksik":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getDocumentIcon = (type: DocumentType) => {
    return <FileText className="h-6 w-6 text-blue-600" />
  }

  // If document is missing (Eksik status), show upload option
  if (document.durum === "Eksik" && canUpload) {
    return (
      <Card className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-900">{document.tip}</p>
              <p className="text-sm text-orange-700">Bu evrak eksik</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("rounded-xl border", getStatusColor(document.durum))}>Eksik</Badge>
            <Button
              className="rounded-xl"
              style={{ backgroundColor: "#F57C00", color: "white" }}
              onClick={() => onUpload?.(document.tip)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Yükle
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            {getDocumentIcon(document.tip)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{document.tip}</p>
            <p className="text-sm text-muted-foreground truncate">{document.dosya_adı}</p>
            {document.yüklenme_tarihi && (
              <p className="text-xs text-muted-foreground">Yüklenme: {document.yüklenme_tarihi}</p>
            )}
            {document.yükleyen && showDealerInfo && (
              <p className="text-xs text-muted-foreground">Yükleyen: {document.yükleyen}</p>
            )}
            {document.müşteri_adı && userRole === "superadmin" && (
              <p className="text-xs text-muted-foreground">Müşteri: {document.müşteri_adı}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={cn("rounded-xl border", getStatusColor(document.durum))}>{document.durum}</Badge>
          {onView && (
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => onView(document)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => onDownload(document)}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
