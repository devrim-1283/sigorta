"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, Download, Filter, FileText, Plus } from "lucide-react"
import { accountingApi } from "@/lib/api-client"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AccountingPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [dateRange, setDateRange] = useState("last-30-days")
  const [transactionType, setTransactionType] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccountingData()
    }
  }, [isAuthenticated, dateRange, transactionType])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const fetchAccountingData = async () => {
    try {
      setLoading(true)
      
      // Fetch from accounting API (using payments as accounting transactions for now)
      const paymentsData = await fetch('/api/payments').then(res => res.json())
      const payments = paymentsData.payments || []
      
      // Calculate stats
      const totalIncome = payments
        .filter((p: any) => p.odeme_turu === 'Gelir' || p.durum === 'Ödendi')
        .reduce((sum: number, p: any) => sum + parseFloat(p.tutar || 0), 0)
      
      const totalExpense = payments
        .filter((p: any) => p.odeme_turu === 'Gider')
        .reduce((sum: number, p: any) => sum + parseFloat(p.tutar || 0), 0)
      
      const pendingPayments = payments
        .filter((p: any) => p.durum === 'Bekliyor')
        .reduce((sum: number, p: any) => sum + parseFloat(p.tutar || 0), 0)
      
      setStats({
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        pendingPayments
      })
      
      // Transform payments to transactions format
      const transformedTransactions = payments.slice(0, 10).map((p: any) => ({
        id: p.id,
        description: p.aciklama || 'Ödeme',
        amount: `₺${parseFloat(p.tutar || 0).toLocaleString('tr-TR')}`,
        date: new Date(p.odeme_tarihi).toLocaleDateString('tr-TR'),
        type: p.durum === 'Ödendi' ? 'income' : 'expense',
        status: p.durum === 'Ödendi' ? 'completed' : p.durum === 'Bekliyor' ? 'pending' : 'overdue',
        category: p.odeme_turu || 'Diğer'
      }))
      
      setTransactions(transformedTransactions)
    } catch (error) {
      console.error('Failed to fetch accounting data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Financial stats from real data
  const financialStats = loading || !stats ? [] : [
    {
      title: "Toplam Gelir",
      value: `₺${stats.totalIncome.toLocaleString('tr-TR')}`,
      change: "",
      icon: TrendingUp,
      color: "#10b981",
      positive: true
    },
    {
      title: "Toplam Gider",
      value: `₺${stats.totalExpense.toLocaleString('tr-TR')}`,
      change: "",
      icon: TrendingDown,
      color: "#ef4444",
      positive: false
    },
    {
      title: "Net Kâr",
      value: `₺${stats.netProfit.toLocaleString('tr-TR')}`,
      change: "",
      icon: DollarSign,
      color: "#0B3D91",
      positive: stats.netProfit >= 0
    },
    {
      title: "Bekleyen Ödemeler",
      value: `₺${stats.pendingPayments.toLocaleString('tr-TR')}`,
      change: "",
      icon: CreditCard,
      color: "#F57C00",
      positive: false
    }
  ]

  const recentTransactions = transactions.length > 0 ? transactions : [
    {
      id: 1,
      description: "Müşteri Ödemesi - Ahmet Yılmaz",
      amount: "₺12,500",
      type: "income",
      date: "06.11.2024",
      status: "completed"
    },
    {
      id: 2,
      description: "Ofis Kirası",
      amount: "₺25,000",
      type: "expense",
      date: "05.11.2024",
      status: "completed"
    },
    {
      id: 3,
      description: "Müşteri Ödemesi - Ayşe Demir",
      amount: "₺8,750",
      type: "income",
      date: "04.11.2024",
      status: "pending"
    },
    {
      id: 4,
      description: "Personel Maaşları",
      amount: "₺85,000",
      type: "expense",
      date: "01.11.2024",
      status: "completed"
    },
    {
      id: 5,
      description: "Müşteri Ödemesi - Mehmet Kaya",
      amount: "₺15,200",
      type: "income",
      date: "31.10.2024",
      status: "completed"
    }
  ]

  const invoices = [
    {
      id: "INV-2024-001",
      customer: "Ahmet Yılmaz",
      amount: "₺12,500",
      date: "06.11.2024",
      status: "paid",
      dueDate: "06.11.2024"
    },
    {
      id: "INV-2024-002",
      customer: "Ayşe Demir",
      amount: "₺8,750",
      date: "04.11.2024",
      status: "pending",
      dueDate: "04.12.2024"
    },
    {
      id: "INV-2024-003",
      customer: "Mehmet Kaya",
      amount: "₺15,200",
      date: "31.10.2024",
      status: "paid",
      dueDate: "31.10.2024"
    },
    {
      id: "INV-2024-004",
      customer: "Fatma Çelik",
      amount: "₺22,300",
      date: "28.10.2024",
      status: "overdue",
      dueDate: "27.10.2024"
    }
  ]

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/oksijen-logo.png" alt="Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Muhasebe</h1>
              <p className="text-sm text-slate-600">Finansal yönetim ve raporlama</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-2xl border-2 font-medium bg-transparent"
          >
            Çıkış Yap
          </Button>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div></div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Rapor İndir
            </Button>
            <Button className="rounded-2xl" style={{ backgroundColor: "#F57C00", color: "white" }}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni İşlem
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih Aralığı</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-7-days">Son 7 Gün</SelectItem>
                    <SelectItem value="last-30-days">Son 30 Gün</SelectItem>
                    <SelectItem value="last-3-months">Son 3 Ay</SelectItem>
                    <SelectItem value="last-6-months">Son 6 Ay</SelectItem>
                    <SelectItem value="last-year">Son 1 Yıl</SelectItem>
                    <SelectItem value="custom">Özel Tarih</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>İşlem Tipi</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm İşlemler</SelectItem>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {financialStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="rounded-3xl border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: stat.color }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      {stat.positive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.positive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Transactions */}
        <Card className="rounded-3xl border-2 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" style={{ color: "#0B3D91" }} />
              Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        transaction.type === 'income' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-6 w-6 text-white" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {transaction.date}
                        </span>
                        <Badge variant="outline" className={
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }>
                          {transaction.status === 'completed' ? 'Tamamlandı' :
                           transaction.status === 'pending' ? 'Beklemede' : 'Gecikmiş'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: "#0B3D91" }} />
              Faturalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Fatura No</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Müşteri</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Tutar</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Tarih</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Vade</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Durum</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-800">{invoice.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-700">{invoice.customer}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-800">{invoice.amount}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-700">{invoice.date}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-700">{invoice.dueDate}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.status === 'paid' ? 'Ödendi' :
                           invoice.status === 'pending' ? 'Beklemede' : 'Gecikmiş'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="outline" size="sm" className="rounded-xl">
                          <Download className="h-4 w-4 mr-2" />
                          İndir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}