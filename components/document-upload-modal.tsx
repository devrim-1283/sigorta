"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Upload, X, FileText, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { DocumentType } from "./document-card"
import type { DocumentType as FileDocType } from "@/lib/file-types-config"

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File, type: DocumentType) => void
  preselectedType?: DocumentType
  availableTypes?: DocumentType[]
  customerId?: string
  customerOptions?: Array<{ id: string; name: string }>
  onCustomerChange?: (customerId: string) => void
  requireCustomer?: boolean
}

export function DocumentUploadModal({ 
  open, 
  onOpenChange, 
  onUpload, 
  preselectedType, 
  availableTypes,
  customerId,
  customerOptions = [],
  onCustomerChange,
  requireCustomer = false
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>(preselectedType || "Kimlik")
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerId || "")
  
  // Update selectedCustomer when customerId prop changes
  useEffect(() => {
    if (customerId && !selectedCustomer) {
      setSelectedCustomer(customerId)
    }
  }, [customerId])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string>("")

  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "application/zip"]
  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): boolean => {
    setError("")

    if (!allowedTypes.includes(file.type)) {
      setError("Sadece PDF, JPG, PNG veya ZIP dosyaları yüklenebilir.")
      return false
    }

    if (file.size > maxSize) {
      setError("Dosya boyutu 10MB'dan küçük olmalıdır.")
      return false
    }

    return true
  }

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = () => {
    if (!selectedFile) {
      setError("Lütfen bir dosya seçin")
      return
    }
    
    if (requireCustomer && !selectedCustomer) {
      setError("Lütfen bir müşteri seçin")
      return
    }
    
    onUpload(selectedFile, documentType)
    setSelectedFile(null)
    setSelectedCustomer("")
    setError("")
    onOpenChange(false)
  }
  
  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value)
    if (onCustomerChange) {
      onCustomerChange(value)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setSelectedCustomer("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
            Evrak Yükle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Document Type and Customer Selection - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">Evrak Tipi</Label>
              <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                <SelectTrigger className="rounded-2xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                  <SelectItem value="Kimlik">Kimlik</SelectItem>
                  <SelectItem value="Ruhsat">Ruhsat</SelectItem>
                  <SelectItem value="Kaza Fotoğrafları">Kaza Fotoğrafları</SelectItem>
                  <SelectItem value="Vekaletname">Vekaletname</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                  {/* Additional document types from file-types-config */}
                  <SelectItem value="musteri-vekaleti">Müşteri Vekaleti</SelectItem>
                  <SelectItem value="eksper-raporu">Eksper Raporu</SelectItem>
                  <SelectItem value="kaza-tutanagi">Kaza Tutanağı</SelectItem>
                  <SelectItem value="masdur-ruhsati">Maşdur Ruhsatı</SelectItem>
                  <SelectItem value="olay-yeri-foto">Olay Yeri Fotoğrafları</SelectItem>
                  <SelectItem value="onarim-foto">Onarım Fotoğrafları</SelectItem>
                  <SelectItem value="iban-bilgisi">İBAN Bilgisi</SelectItem>
                  <SelectItem value="vekalet">Vekalet</SelectItem>
                  <SelectItem value="parca-farki-foto">Parça Farkı Fotoğrafları</SelectItem>
                  <SelectItem value="parca-farki-fatura">Parça Farkı Faturaları</SelectItem>
                  <SelectItem value="muvafakatname">Muvafakatname</SelectItem>
                  <SelectItem value="arac-ruhsati">Araç Ruhsatı</SelectItem>
                  <SelectItem value="saglik-raporu">Sağlık Raporu</SelectItem>
                  <SelectItem value="alkol-metabolit-raporu">Alkol-Metabolit Raporu</SelectItem>
                  <SelectItem value="adli-tip-raporu">Adli Tıp Raporu</SelectItem>
                  <SelectItem value="hasar-tespit-tutanagi">Hasar Tespit Tutanağı</SelectItem>
                  <SelectItem value="kasko-deger-listesi">Kasko Değer Listesi</SelectItem>
                  <SelectItem value="onarim-faturalari">Onarım Faturaları</SelectItem>
                  <SelectItem value="icra-takip-dosyasi">İcra Takip Dosyası</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Selection */}
            {customerOptions.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">
                  Müşteri {requireCustomer && '*'}
                </Label>
                <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                  <SelectTrigger className="rounded-2xl border-2">
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto z-[100]">
                    {customerOptions.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Drag & Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-3xl p-12 text-center transition-colors",
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50",
              selectedFile && "border-green-500 bg-green-50",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setSelectedFile(null)
                    setError("")
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Kaldır
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-lg mb-2">Dosyayı buraya sürükleyin</p>
                  <p className="text-sm text-muted-foreground mb-4">veya</p>
                  <label htmlFor="file-input">
                    <Button
                      type="button"
                      className="rounded-2xl"
                      style={{ backgroundColor: "#F57C00", color: "white" }}
                      onClick={() => document.getElementById("file-input")?.click()}
                    >
                      Dosya Seç
                    </Button>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.zip"
                    onChange={handleFileInputChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG veya ZIP (Maks. 10MB)</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-2xl bg-transparent" onClick={handleClose}>
              İptal
            </Button>
            <Button
              className="rounded-2xl"
              style={{ backgroundColor: "#0B3D91", color: "white" }}
              onClick={handleUpload}
              disabled={!selectedFile || (requireCustomer && !selectedCustomer)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Yükle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
