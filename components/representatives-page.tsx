"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  TrendingUp,
  Eye,
  MoreVertical,
  Star,
  Users,
  Briefcase,
  Award,
  Clock,
  MessageCircle,
  ExternalLink,
  User,
  FileText,
  Activity,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Sample representatives data
const representativesData = [
  {
    id: "REP-001",
    name: "Elif Kaya",
    email: "elif.kaya@aksigorta.com.tr",
    phone: "+90 532 111 2233",
    company: "Ak Sigorta",
    position: "Bölge Müdürü",
    location: "İstanbul",
    joinDate: "2021-03-15",
    clients: 45,
    totalPolicies: 127,
    totalPremium: "₺2,450,000",
    status: "Aktif",
    experience: "8 yıl",
    specialization: "Kasko & Trafik",
    lastActivity: "2 saat önce",
    rating: 5,
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "REP-002",
    name: "Mehmet Özdemir",
    email: "mehmet.ozdemir@allianz.com.tr",
    phone: "+90 533 444 5566",
    company: "Allianz Sigorta",
    position: "Satış Temsilcisi",
    location: "Ankara",
    joinDate: "2022-01-20",
    clients: 32,
    totalPolicies: 89,
    totalPremium: "₺1,780,000",
    status: "Aktif",
    experience: "5 yıl",
    specialization: "Hayat & Sağlık",
    lastActivity: "1 gün önce",
    rating: 4,
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "REP-003",
    name: "Ayşe Yılmaz",
    email: "ayse.yilmaz@anadolu.com.tr",
    phone: "+90 534 777 8899",
    company: "Anadolu Sigorta",
    position: "Kıdemli Temsilci",
    location: "İzmir",
    joinDate: "2020-09-10",
    clients: 58,
    totalPolicies: 156,
    totalPremium: "₺3,120,000",
    status: "Aktif",
    experience: "12 yıl",
    specialization: "Konut & İşyeri",
    lastActivity: "4 saat önce",
    rating: 5,
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "REP-004",
    name: "Can Demir",
    email: "can.demir@mapfre.com.tr",
    phone: "+90 535 222 3344",
    company: "Mapfre Sigorta",
    position: "Satış Danışmanı",
    location: "Bursa",
    joinDate: "2023-02-28",
    clients: 18,
    totalPolicies: 42,
    totalPremium: "₺890,000",
    status: "Pasif",
    experience: "2 yıl",
    specialization: "Kasko & Trafik",
    lastActivity: "1 hafta önce",
    rating: 3,
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "REP-005",
    name: "Zeynep Arslan",
    email: "zeynep.arslan@zurich.com.tr",
    phone: "+90 536 555 6677",
    company: "Zurich Sigorta",
    position: "Bölge Koordinatörü",
    location: "Antalya",
    joinDate: "2021-11-05",
    clients: 41,
    totalPolicies: 98,
    totalPremium: "₺2,100,000",
    status: "Aktif",
    experience: "7 yıl",
    specialization: "Kurumsal Sigortalar",
    lastActivity: "6 saat önce",
    rating: 4,
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "REP-006",
    name: "Burak Şahin",
    email: "burak.sahin@hdi.com.tr",
    phone: "+90 537 888 9900",
    company: "HDI Sigorta",
    position: "Satış Müdürü",
    location: "Adana",
    joinDate: "2019-06-12",
    clients: 67,
    totalPolicies: 189,
    totalPremium: "₺4,250,000",
    status: "Aktif",
    experience: "15 yıl",
    specialization: "Tüm Branşlar",
    lastActivity: "1 saat önce",
    rating: 5,
    avatar: "/placeholder.svg?height=80&width=80",
  },
]

export function RepresentativesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [selectedRepresentative, setSelectedRepresentative] = useState<(typeof representativesData)[0] | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  // Get unique companies for filter
  const companies = Array.from(new Set(representativesData.map((rep) => rep.company)))

  // Filter and sort representatives
  const filteredRepresentatives = representativesData
    .filter((rep) => {
      const matchesSearch =
        rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.phone.includes(searchTerm) ||
        rep.company.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || rep.status.toLowerCase() === statusFilter
      const matchesCompany = companyFilter === "all" || rep.company === companyFilter

      return matchesSearch && matchesStatus && matchesCompany
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "premium":
          return (
            Number.parseFloat(b.totalPremium.replace(/[₺,]/g, "")) -
            Number.parseFloat(a.totalPremium.replace(/[₺,]/g, ""))
          )
        case "clients":
          return b.clients - a.clients
        case "experience":
          return Number.parseInt(b.experience) - Number.parseInt(a.experience)
        default:
          return 0
      }
    })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    return status === "Aktif"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getCompanyColor = (company: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-purple-100 text-purple-800",
      "bg-indigo-100 text-indigo-800",
      "bg-teal-100 text-teal-800",
      "bg-pink-100 text-pink-800",
      "bg-cyan-100 text-cyan-800",
    ]
    const index = companies.indexOf(company) % colors.length
    return colors[index]
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
    ))
  }

  const getRepresentativeCustomers = (repId: string) => {
    const customers = [
      {
        id: "C001",
        name: "Ahmet Yılmaz",
        phone: "+90 532 111 2233",
        email: "ahmet@email.com",
        policies: 3,
        totalPremium: "₺45,000",
        joinDate: "2023-01-15",
      },
      {
        id: "C002",
        name: "Fatma Kaya",
        phone: "+90 533 444 5566",
        email: "fatma@email.com",
        policies: 2,
        totalPremium: "₺32,000",
        joinDate: "2023-02-20",
      },
      {
        id: "C003",
        name: "Mehmet Özkan",
        phone: "+90 534 777 8899",
        email: "mehmet@email.com",
        policies: 4,
        totalPremium: "₺67,000",
        joinDate: "2023-03-10",
      },
      {
        id: "C004",
        name: "Ayşe Demir",
        phone: "+90 535 222 3344",
        email: "ayse@email.com",
        policies: 1,
        totalPremium: "₺18,000",
        joinDate: "2023-04-05",
      },
      {
        id: "C005",
        name: "Ali Şahin",
        phone: "+90 536 555 6677",
        email: "ali@email.com",
        policies: 5,
        totalPremium: "₺89,000",
        joinDate: "2023-05-12",
      },
    ]
    return customers
  }

  const handleDetailsClick = (rep: (typeof representativesData)[0]) => {
    setSelectedRepresentative(rep)
    setShowDetailsModal(true)
  }

  const handleContactClick = (rep: (typeof representativesData)[0]) => {
    setSelectedRepresentative(rep)
    setShowContactModal(true)
  }

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, "_blank")
  }

  const handlePhoneClick = (phone: string) => {
    window.open(`tel:${phone}`, "_blank")
  }

  const handleWhatsAppClick = (phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, "").replace("+", "")
    window.open(`https://wa.me/${cleanPhone}`, "_blank")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0B3D91" }}>
            Sigorta Şirket Temsilcileri
          </h1>
          <p className="text-muted-foreground font-medium mt-2">
            Toplam {representativesData.length} temsilci • {filteredRepresentatives.length} sonuç gösteriliyor
          </p>
        </div>
        <Button
          className="rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all px-6"
          style={{ backgroundColor: "#F57C00", color: "white" }}
        >
          <Plus className="mr-2 h-5 w-5" />
          Yeni Temsilci Ekle
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-3xl border-2 shadow-lg bg-gradient-to-r from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 text-muted-foreground -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Temsilci ara (isim, email, telefon, şirket)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-2xl border-2 font-medium focus:border-primary/50 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-2xl border-2 font-medium">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>

              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[160px] rounded-2xl border-2 font-medium">
                  <SelectValue placeholder="Şirket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şirketler</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] rounded-2xl border-2 font-medium">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">İsme Göre</SelectItem>
                  <SelectItem value="premium">Prime Göre</SelectItem>
                  <SelectItem value="clients">Müşteri Sayısı</SelectItem>
                  <SelectItem value="experience">Deneyime Göre</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="rounded-2xl border-2 font-medium hover:bg-slate-50 bg-transparent">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representatives Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRepresentatives.map((rep, index) => (
          <motion.div
            key={rep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 group hover:border-primary/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                        <AvatarImage src={rep.avatar || "/placeholder.svg"} />
                        <AvatarFallback
                          className="font-bold text-lg"
                          style={{ backgroundColor: "#0B3D91", color: "white" }}
                        >
                          {getInitials(rep.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: "#F57C00" }}
                      >
                        <Briefcase className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                        {rep.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">{rep.position}</p>
                      <div className="flex items-center gap-1 mt-1">{renderStars(rep.rating)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={cn("rounded-2xl font-semibold border", getStatusColor(rep.status))}>
                      {rep.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl">
                        <DropdownMenuItem className="rounded-xl" onClick={() => handleDetailsClick(rep)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detayları Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl" onClick={() => handleContactClick(rep)}>
                          <Mail className="mr-2 h-4 w-4" />
                          İletişim
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Company Badge */}
                <div className="flex justify-center">
                  <Badge className={cn("rounded-2xl font-semibold px-4 py-1", getCompanyColor(rep.company))}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {rep.company}
                  </Badge>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-muted-foreground flex-1 truncate">{rep.email}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium text-muted-foreground">{rep.phone}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-medium text-muted-foreground">{rep.location}</span>
                  </div>
                </div>

                {/* Specialization */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Uzmanlık:</span>
                  <span className="text-sm font-semibold" style={{ color: "#0B3D91" }}>
                    {rep.specialization}
                  </span>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold" style={{ color: "#0B3D91" }}>
                      {rep.clients}
                    </p>
                    <p className="text-xs text-muted-foreground">Müşteri</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold" style={{ color: "#0B3D91" }}>
                      {rep.totalPolicies}
                    </p>
                    <p className="text-xs text-muted-foreground">Poliçe</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold" style={{ color: "#0B3D91" }}>
                      {rep.experience.split(" ")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">Yıl</p>
                  </div>
                </div>

                {/* Premium */}
                <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-700 font-medium">Toplam Prim</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: "#F57C00" }}>
                    {rep.totalPremium}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Katıldı: {rep.joinDate}</span>
                  </div>
                  <span className="font-medium">Son: {rep.lastActivity}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-2xl border-2 font-semibold hover:bg-slate-50 bg-transparent"
                    onClick={() => handleDetailsClick(rep)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Detaylar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all"
                    style={{ backgroundColor: "#0B3D91", color: "white" }}
                    onClick={() => handleContactClick(rep)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    İletişim
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRepresentatives.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Briefcase className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Temsilci bulunamadı</h3>
          <p className="text-muted-foreground mb-6">
            Arama kriterlerinize uygun temsilci bulunmuyor. Filtreleri değiştirmeyi deneyin.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setCompanyFilter("all")
            }}
            className="rounded-2xl font-semibold"
          >
            Filtreleri Temizle
          </Button>
        </div>
      )}

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ color: "#0B3D91" }}>
              <User className="h-6 w-6" />
              Temsilci Detayları
            </DialogTitle>
          </DialogHeader>

          {selectedRepresentative && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl">
                <TabsTrigger value="info" className="rounded-xl">
                  Kişi Bilgileri
                </TabsTrigger>
                <TabsTrigger value="customers" className="rounded-xl">
                  Müşteriler
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl">
                  Aktivite
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Kişisel Bilgiler
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={selectedRepresentative.avatar || "/placeholder.svg"} />
                          <AvatarFallback style={{ backgroundColor: "#0B3D91", color: "white" }}>
                            {getInitials(selectedRepresentative.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-xl">{selectedRepresentative.name}</h4>
                          <p className="text-muted-foreground">{selectedRepresentative.position}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(selectedRepresentative.rating)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedRepresentative.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefon:</span>
                          <span className="font-medium">{selectedRepresentative.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Konum:</span>
                          <span className="font-medium">{selectedRepresentative.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deneyim:</span>
                          <span className="font-medium">{selectedRepresentative.experience}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uzmanlık:</span>
                          <span className="font-medium">{selectedRepresentative.specialization}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company & Stats */}
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Şirket & İstatistikler
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h4 className="font-bold text-lg">{selectedRepresentative.company}</h4>
                        <p className="text-sm text-muted-foreground">{selectedRepresentative.position}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                          <Users className="h-6 w-6 mx-auto mb-1 text-green-600" />
                          <p className="font-bold text-lg">{selectedRepresentative.clients}</p>
                          <p className="text-xs text-muted-foreground">Müşteri</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-xl">
                          <FileText className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                          <p className="font-bold text-lg">{selectedRepresentative.totalPolicies}</p>
                          <p className="text-xs text-muted-foreground">Poliçe</p>
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <p className="font-bold text-2xl" style={{ color: "#F57C00" }}>
                          {selectedRepresentative.totalPremium}
                        </p>
                        <p className="text-sm text-muted-foreground">Toplam Prim</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Kayıt Ettiği Müşteriler</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    {getRepresentativeCustomers(selectedRepresentative.id).length} Müşteri
                  </Badge>
                </div>

                <div className="space-y-3">
                  {getRepresentativeCustomers(selectedRepresentative.id).map((customer) => (
                    <Card key={customer.id} className="rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback style={{ backgroundColor: "#0B3D91", color: "white" }}>
                                {getInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{customer.name}</h4>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold" style={{ color: "#F57C00" }}>
                              {customer.totalPremium}
                            </p>
                            <p className="text-sm text-muted-foreground">{customer.policies} Poliçe</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg">Son Aktiviteler</h3>
                <div className="space-y-3">
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Yeni müşteri kaydı</p>
                          <p className="text-sm text-muted-foreground">2 saat önce</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Poliçe yenileme</p>
                          <p className="text-sm text-muted-foreground">1 gün önce</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3" style={{ color: "#0B3D91" }}>
              <MessageCircle className="h-5 w-5" />
              İletişim Bilgileri
            </DialogTitle>
          </DialogHeader>

          {selectedRepresentative && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={selectedRepresentative.avatar || "/placeholder.svg"} />
                  <AvatarFallback style={{ backgroundColor: "#0B3D91", color: "white" }}>
                    {getInitials(selectedRepresentative.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{selectedRepresentative.name}</h3>
                <p className="text-muted-foreground">{selectedRepresentative.position}</p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-2xl p-4 h-auto hover:bg-blue-50 bg-transparent"
                  onClick={() => handleEmailClick(selectedRepresentative.email)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Email Gönder</p>
                      <p className="text-sm text-muted-foreground">{selectedRepresentative.email}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start rounded-2xl p-4 h-auto hover:bg-green-50 bg-transparent"
                  onClick={() => handlePhoneClick(selectedRepresentative.phone)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Telefon Ara</p>
                      <p className="text-sm text-muted-foreground">{selectedRepresentative.phone}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start rounded-2xl p-4 h-auto hover:bg-green-50 bg-transparent"
                  onClick={() => handleWhatsAppClick(selectedRepresentative.phone)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">WhatsApp Mesaj</p>
                      <p className="text-sm text-muted-foreground">{selectedRepresentative.phone}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
