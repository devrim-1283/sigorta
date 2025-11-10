export type ResultDocumentType =
  | "ihtarname"
  | "tahkim-basvuru"
  | "tahkim-karar"
  | "sigorta-odeme-dekontu"
  | "musteri-odeme-dekontu"
  | "bilirkisi-raporu"
  | "esnaf-talimat"
  | "icra-dilekce"

export interface ResultDocument {
  id: ResultDocumentType
  label: string
  description: string
  visibleToCustomer: boolean
  visibleToDealer: boolean
}

export const RESULT_DOCUMENTS: ResultDocument[] = [
  {
    id: "ihtarname",
    label: "Sigortaya Çekilen İhtarname",
    description: "Sigorta şirketine gönderilen resmi ihtarname belgesi",
    visibleToCustomer: true,
    visibleToDealer: true,
  },
  {
    id: "tahkim-basvuru",
    label: "Tahkim Başvuru Dilekçesi",
    description: "Tahkim komisyonuna yapılan başvuru dilekçesi",
    visibleToCustomer: true,
    visibleToDealer: true,
  },
  {
    id: "tahkim-karar",
    label: "Tahkim Komisyon Kararı",
    description: "Tahkim komisyonunun nihai kararı",
    visibleToCustomer: true,
    visibleToDealer: true,
  },
  {
    id: "sigorta-odeme-dekontu",
    label: "Sigortadan Gelen Ödeme Dekontu",
    description: "Sigorta şirketinden alınan ödeme belgesi",
    visibleToCustomer: true,
    visibleToDealer: true,
  },
  {
    id: "musteri-odeme-dekontu",
    label: "Müşteriye Yapılan Ödeme Dekontu",
    description: "Sistem tarafından müşteriye yapılan ödeme belgesi",
    visibleToCustomer: true,
    visibleToDealer: true,
  },
  {
    id: "bilirkisi-raporu",
    label: "Bilirkişi Raporu",
    description: "Mahkeme tarafından atanan bilirkişinin hazırladığı rapor",
    visibleToCustomer: true,
    visibleToDealer: true,
  },
  {
    id: "esnaf-talimat",
    label: "Esnaf İçin Talimat Evrakı",
    description: "Esnaf için hazırlanan talimat ve yönlendirme evrakı",
    visibleToCustomer: false,
    visibleToDealer: true,
  },
  {
    id: "icra-dilekce",
    label: "İcra Dilekçesi",
    description: "İcra takibi için hazırlanan dilekçe",
    visibleToCustomer: false,
    visibleToDealer: true,
  },
]

export function getResultDocument(id: ResultDocumentType): ResultDocument | undefined {
  return RESULT_DOCUMENTS.find((doc) => doc.id === id)
}

export function getVisibleResultDocuments(userRole: "musteri" | "bayi" | "admin"): ResultDocument[] {
  if (userRole === "musteri") {
    return RESULT_DOCUMENTS.filter((doc) => doc.visibleToCustomer)
  } else if (userRole === "bayi") {
    return RESULT_DOCUMENTS.filter((doc) => doc.visibleToDealer)
  }
  return RESULT_DOCUMENTS // Admin sees all
}
