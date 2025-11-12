"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, Download, Filter, FileText, Plus, Edit, Trash2 } from "lucide-react"
import { accountingApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/role-config"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AccountingPage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const userRole: UserRole = (user?.role?.name as UserRole) || "superadmin"
  const [dateRange, setDateRange] = useState("last-30-days")
  const [transactionType, setTransactionType] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    document_url: '',
  })

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
      
      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'last-7-days':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'last-30-days':
          startDate.setDate(endDate.getDate() - 30)
          break
        case 'last-3-months':
          startDate.setMonth(endDate.getMonth() - 3)
          break
        case 'last-6-months':
          startDate.setMonth(endDate.getMonth() - 6)
          break
        case 'last-year':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
        default:
          startDate.setDate(endDate.getDate() - 30)
      }

      // Fetch from accounting API
      const params: any = {
        startDate,
        endDate,
      }
      
      if (transactionType !== 'all') {
        params.type = transactionType
      }

      const [transactionsData, statsData] = await Promise.all([
        accountingApi.list(params),
        accountingApi.getStats({ startDate, endDate }),
      ])

      const accountingTransactions = transactionsData.transactions || []
      
      setStats({
        totalIncome: parseFloat(statsData.totalIncome || '0'),
        totalExpense: parseFloat(statsData.totalExpense || '0'),
        netProfit: parseFloat(statsData.netProfit || '0'),
        pendingPayments: 0, // This would need to be calculated separately
      })
      
      // Transform transactions - keep full data for editing
      const transformedTransactions = accountingTransactions.map((t: any) => ({
        id: t.id,
        description: t.description || t.category || 'İşlem',
        amount: `₺${parseFloat(t.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawAmount: parseFloat(t.amount || 0),
        date: new Date(t.transaction_date).toLocaleDateString('tr-TR'),
        rawDate: t.transaction_date,
        type: t.type,
        status: 'completed',
        category: t.category || 'Diğer',
        document_url: t.document_url || '',
        // Keep original data for editing
        originalData: t
      }))
      
      setTransactions(transformedTransactions)
    } catch (error: any) {
      console.error('Failed to fetch accounting data:', error)
      toast({
        title: 'Uyarı',
        description: error?.message || 'Muhasebe verileri yüklenemedi',
        variant: 'default',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async () => {
    try {
      if (!formData.type || !formData.amount || !formData.transaction_date) {
        toast({
          title: 'Hata',
          description: 'Lütfen tüm zorunlu alanları doldurun',
          variant: 'destructive',
        })
        return
      }

      await accountingApi.create({
        type: formData.type,
        category: formData.category || null,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        transaction_date: new Date(formData.transaction_date),
        document_url: formData.document_url || null,
      })

      toast({
        title: 'Başarılı',
        description: 'İşlem başarıyla eklendi',
      })

      setIsCreateDialogOpen(false)
      setFormData({
        type: 'income',
        category: '',
        description: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        document_url: '',
      })

      // Refresh data
      await fetchAccountingData()
    } catch (error: any) {
      console.error('Failed to create transaction:', error)
      toast({
        title: 'Uyarı',
        description: error?.message || 'İşlem eklenemedi',
        variant: 'default',
        duration: 5000,
      })
    }
  }

  const handleDownloadReport = async () => {
    try {
      setIsDownloadingReport(true)

      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'last-7-days':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'last-30-days':
          startDate.setDate(endDate.getDate() - 30)
          break
        case 'last-3-months':
          startDate.setMonth(endDate.getMonth() - 3)
          break
        case 'last-6-months':
          startDate.setMonth(endDate.getMonth() - 6)
          break
        case 'last-year':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
        default:
          startDate.setDate(endDate.getDate() - 30)
      }

      // Fetch transactions for report
      const params: any = {
        startDate,
        endDate,
        perPage: 1000, // Get all transactions
      }
      
      if (transactionType !== 'all') {
        params.type = transactionType
      }

      const transactionsData = await accountingApi.list(params)
      const statsData = await accountingApi.getStats({ startDate, endDate })

      // Create CSV content
      const csvRows = [
        ['Muhasebe Raporu'],
        [`Tarih Aralığı: ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`],
        [''],
        ['Özet'],
        [`Toplam Gelir,${statsData.totalIncome}`],
        [`Toplam Gider,${statsData.totalExpense}`],
        [`Net Kâr,${statsData.netProfit}`],
        [''],
        ['İşlemler'],
        ['ID', 'Tür', 'Kategori', 'Açıklama', 'Tutar', 'Tarih'],
      ]

      transactionsData.transactions.forEach((t: any) => {
        csvRows.push([
          t.id.toString(),
          t.type === 'income' ? 'Gelir' : 'Gider',
          t.category || '',
          t.description || '',
          t.amount,
          new Date(t.transaction_date).toLocaleDateString('tr-TR'),
        ])
      })

      const csvContent = csvRows.map(row => row.join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `muhasebe-raporu-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Başarılı',
        description: 'Rapor başarıyla indirildi',
      })
    } catch (error: any) {
      console.error('Failed to download report:', error)
      toast({
        title: 'Uyarı',
        description: error?.message || 'Rapor indirilemedi',
        variant: 'default',
        duration: 5000,
      })
    } finally {
      setIsDownloadingReport(false)
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

  const recentTransactions = transactions

  const handleEditTransaction = (transaction: any) => {
    const original = transaction.originalData || transaction
    setEditingTransaction(transaction)
    setFormData({
      type: original.type || 'income',
      category: original.category || '',
      description: original.description || '',
      amount: original.amount || transaction.rawAmount?.toString() || '',
      transaction_date: original.transaction_date ? new Date(original.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      document_url: original.document_url || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return

    try {
      if (!formData.type || !formData.amount || !formData.transaction_date) {
        toast({
          title: 'Hata',
          description: 'Lütfen tüm zorunlu alanları doldurun',
          variant: 'destructive',
        })
        return
      }

      await accountingApi.update(editingTransaction.id, {
        type: formData.type,
        category: formData.category || null,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        transaction_date: new Date(formData.transaction_date),
        document_url: formData.document_url || null,
      })

      toast({
        title: 'Başarılı',
        description: 'İşlem başarıyla güncellendi',
      })

      setIsEditDialogOpen(false)
      setEditingTransaction(null)
      setFormData({
        type: 'income',
        category: '',
        description: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        document_url: '',
      })

      // Refresh data
      await fetchAccountingData()
    } catch (error: any) {
      console.error('Failed to update transaction:', error)
      toast({
        title: 'Uyarı',
        description: error?.message || 'İşlem güncellenemedi',
        variant: 'default',
        duration: 5000,
      })
    }
  }

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      await accountingApi.delete(transactionId)

      toast({
        title: 'Başarılı',
        description: 'İşlem başarıyla silindi',
      })

      // Refresh data
      await fetchAccountingData()
    } catch (error: any) {
      console.error('Failed to delete transaction:', error)
      toast({
        title: 'Uyarı',
        description: error?.message || 'İşlem silinemedi',
        variant: 'default',
        duration: 5000,
      })
    }
  }

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
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <img src="/oksijen-logo.png" alt="Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Muhasebe</h1>
              <p className="text-xs md:text-sm text-slate-600">Finansal yönetim ve raporlama</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-2xl border-2 font-medium bg-transparent hidden md:inline-flex"
          >
            Çıkış Yap
          </Button>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button 
            variant="outline" 
            className="rounded-2xl bg-transparent w-full sm:w-auto"
            onClick={handleDownloadReport}
            disabled={isDownloadingReport || loading}
          >
            <Download className={`mr-2 h-4 w-4 ${isDownloadingReport ? 'animate-spin' : ''}`} />
            {isDownloadingReport ? 'İndiriliyor...' : 'Rapor İndir'}
          </Button>
          <Button 
            className="rounded-2xl w-full sm:w-auto" 
            style={{ backgroundColor: "#F57C00", color: "white" }}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni İşlem
          </Button>
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
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#0B3D91" }} />
              Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Henüz işlem kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-2xl border-2 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div
                      className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl shrink-0 ${
                        transaction.type === 'income' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      ) : (
                        <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm md:text-base truncate">{transaction.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {transaction.date}
                        </span>
                        <Badge variant="outline" className={`text-xs ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {transaction.status === 'completed' ? 'Tamamlandı' :
                           transaction.status === 'pending' ? 'Beklemede' : 'Gecikmiş'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-left sm:text-right">
                      <p className={`text-lg md:text-xl font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Edit Transaction Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">İşlem Düzenle</DialogTitle>
              <DialogDescription>
                Muhasebe işlemini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_type">İşlem Türü *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_category">Kategori</Label>
                <Input
                  id="edit_category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Örn: Maaş, Kira, Satış"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Tutar *</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_transaction_date">Tarih *</Label>
                <Input
                  id="edit_transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Açıklama</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="İşlem açıklaması"
                  className="rounded-xl"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_document_url">Döküman URL (Opsiyonel)</Label>
                <Input
                  id="edit_document_url"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingTransaction(null)
                }}
                className="rounded-xl"
              >
                İptal
              </Button>
              <Button
                onClick={handleUpdateTransaction}
                className="rounded-xl"
                style={{ backgroundColor: "#F57C00", color: "white" }}
                disabled={!formData.type || !formData.amount || !formData.transaction_date}
              >
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Transaction Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Yeni İşlem Ekle</DialogTitle>
              <DialogDescription>
                Muhasebe işlemi ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">İşlem Türü *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Örn: Maaş, Kira, Satış"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Tutar *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Tarih *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="İşlem açıklaması"
                  className="rounded-xl"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_url">Döküman URL (Opsiyonel)</Label>
                <Input
                  id="document_url"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="rounded-xl"
              >
                İptal
              </Button>
              <Button
                onClick={handleCreateTransaction}
                className="rounded-xl"
                style={{ backgroundColor: "#F57C00", color: "white" }}
                disabled={!formData.type || !formData.amount || !formData.transaction_date}
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}