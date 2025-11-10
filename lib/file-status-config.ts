export type FileStatus =
  | "evrak-asamasinda"
  | "basvuru-asamasinda"
  | "basvuru-yapildi"
  | "tahkim-basvurusu-yapildi"
  | "tahkim-asamasinda"
  | "icra-asamasinda"
  | "dosya-kapandi"

export interface FileStatusConfig {
  id: FileStatus
  label: string
  description: string
  color: string
  order: number
}

export const FILE_STATUSES: FileStatusConfig[] = [
  {
    id: "evrak-asamasinda",
    label: "Evrak Aşamasında",
    description: "Zorunlu evraklar yükleniyor",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    order: 1,
  },
  {
    id: "basvuru-asamasinda",
    label: "Başvuru Aşamasında",
    description: "Evraklar tamam, başvuru hazırlıkta",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    order: 2,
  },
  {
    id: "basvuru-yapildi",
    label: "Başvuru Yapıldı",
    description: "Başvuru tamamlandı",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    order: 3,
  },
  {
    id: "tahkim-basvurusu-yapildi",
    label: "Tahkim Başvurusu Yapıldı",
    description: "Tahkim dilekçesi yüklendi, süreç başlatıldı",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    order: 4,
  },
  {
    id: "tahkim-asamasinda",
    label: "Tahkim Aşamasında",
    description: "Komisyon incelemesi devam ediyor",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    order: 5,
  },
  {
    id: "icra-asamasinda",
    label: "İcra Aşamasında",
    description: "Dosya yargısal aşamada",
    color: "bg-red-100 text-red-800 border-red-300",
    order: 6,
  },
  {
    id: "dosya-kapandi",
    label: "Dosya Kapandı / Birleştirildi",
    description: "Süreç sona erdi, dosya kapalı (read-only)",
    color: "bg-green-100 text-green-800 border-green-300",
    order: 7,
  },
]

export function getFileStatusConfig(status: FileStatus): FileStatusConfig | undefined {
  return FILE_STATUSES.find((s) => s.id === status)
}

export function getFileStatusColor(status: FileStatus): string {
  return getFileStatusConfig(status)?.color || "bg-gray-100 text-gray-800 border-gray-300"
}
