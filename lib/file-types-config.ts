export type FileType = "deger-kaybi" | "parca-iscilik" | "arac-mahrumiyeti" | "pert-farki"

export type DocumentType =
  | "musteri-vekaleti"
  | "eksper-raporu"
  | "kaza-tutanagi"
  | "masdur-ruhsati"
  | "olay-yeri-foto"
  | "onarim-foto"
  | "iban-bilgisi"
  | "vekalet"
  | "parca-farki-foto"
  | "parca-farki-fatura"
  | "muvafakatname"
  | "arac-ruhsati"

export interface RequiredDocument {
  id: DocumentType
  label: string
  minCount?: number
}

export interface FileTypeConfig {
  id: FileType
  label: string
  color: string
  requiredDocuments: RequiredDocument[]
}

export const FILE_TYPES: FileTypeConfig[] = [
  {
    id: "deger-kaybi",
    label: "Değer Kaybı Dosyası",
    color: "bg-green-500",
    requiredDocuments: [
      { id: "musteri-vekaleti", label: "Müşteri vekaleti" },
      { id: "eksper-raporu", label: "Eksper raporu" },
      { id: "kaza-tutanagi", label: "Kaza tutanağı" },
    ],
  },
  {
    id: "parca-iscilik",
    label: "Parça ve İşçilik Farkı Dosyası",
    color: "bg-blue-500",
    requiredDocuments: [
      { id: "masdur-ruhsati", label: "Maşdur ruhsatı" },
      { id: "olay-yeri-foto", label: "Olay yeri fotoğrafları", minCount: 2 },
      { id: "onarim-foto", label: "Onarım fotoğrafları", minCount: 2 },
      { id: "iban-bilgisi", label: "İBAN bilgisi" },
      { id: "vekalet", label: "Vekalet" },
      { id: "parca-farki-foto", label: "Parça farkını beyan eden fotoğraflar" },
      { id: "parca-farki-fatura", label: "Parça farkını beyan eden faturalar" },
      { id: "eksper-raporu", label: "Eksper raporu" },
    ],
  },
  {
    id: "arac-mahrumiyeti",
    label: "Araç Mahrumiyeti Dosyası",
    color: "bg-orange-500",
    requiredDocuments: [
      { id: "muvafakatname", label: "Muvafakatname" },
      { id: "eksper-raporu", label: "Eksper raporu" },
      { id: "vekalet", label: "Vekalet" },
      { id: "arac-ruhsati", label: "Araç ruhsatı" },
      { id: "iban-bilgisi", label: "İBAN bilgisi" },
    ],
  },
  {
    id: "pert-farki",
    label: "Pert Farkı Dosyası",
    color: "bg-red-500",
    requiredDocuments: [
      // Henüz net değil, diğerleriyle aynı sistemde çalışacak
      { id: "vekalet", label: "Vekalet" },
      { id: "eksper-raporu", label: "Eksper raporu" },
      { id: "iban-bilgisi", label: "İBAN bilgisi" },
    ],
  },
]

export function getFileTypeConfig(fileType: FileType): FileTypeConfig | undefined {
  return FILE_TYPES.find((ft) => ft.id === fileType)
}

export function calculateFileStatus(fileType: FileType, uploadedDocuments: DocumentType[]): string {
  const config = getFileTypeConfig(fileType)
  if (!config) return "İnceleniyor"

  const allRequiredUploaded = config.requiredDocuments.every((doc) => uploadedDocuments.includes(doc.id))

  // Tüm zorunlu evraklar tamamlandıysa → Başvuru Aşamasında
  if (allRequiredUploaded) {
    return "Başvuru Aşamasında"
  }

  // Eksik zorunlu belge varsa → Evrak Aşamasında
  return "Evrak Aşamasında"
}
