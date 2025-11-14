'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import { getSMSLogs, getSMSStats, sendManualSMS, updateSMSStatus, getCustomersForSMS } from '@/lib/actions/sms'

export const dynamic = 'force-dynamic'

interface SMSLog {
  id: number
  recipient_name?: string
  recipient_phone: string
  message: string
  sender_name: string
  job_id?: string
  status: string
  delivery_status?: string
  error_message?: string
  customer_id?: number
  sent_by?: number
  sent_at: string
  delivered_at?: string
  customer?: {
    id: number
    ad_soyad: string
    telefon: string
  }
  sender?: {
    id: number
    name: string
  }
}

interface SMSStats {
  total: number
  sent: number
  delivered: number
  failed: number
  pending: number
}

interface Customer {
  id: number
  ad_soyad: string
  telefon: string
  email?: string
}

export default function SMSManagementPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<SMSLog[]>([])
  const [stats, setStats] = useState<SMSStats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingManual, setSendingManual] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [customerSearch, setCustomerSearch] = useState('')
  
  // Manual SMS form
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [manualPhone, setManualPhone] = useState('')
  const [manualMessage, setManualMessage] = useState('')
  const [manualError, setManualError] = useState('')
  const [manualSuccess, setManualSuccess] = useState('')

  // Check if user is superadmin
  useEffect(() => {
    if (!authLoading && (!user || user.role?.name !== 'superadmin')) {
      router.push('/admin/dashboard')
    }
  }, [user, authLoading, router])

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      const [logsData, statsData] = await Promise.all([
        getSMSLogs({
          page: currentPage,
          perPage: 50,
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        getSMSStats(),
      ])
      
      setLogs(logsData.logs)
      setTotalPages(logsData.totalPages)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load SMS data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load customers for dropdown
  const loadCustomers = async (search?: string) => {
    try {
      const data = await getCustomersForSMS(search)
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }

  useEffect(() => {
    if (user?.role?.name === 'superadmin') {
      loadData()
    }
  }, [user, currentPage, searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch) {
        loadCustomers(customerSearch)
      } else {
        loadCustomers()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  // Handle manual SMS send
  const handleManualSend = async () => {
    setManualError('')
    setManualSuccess('')

    const phone = selectedCustomer ? selectedCustomer.telefon : manualPhone
    if (!phone || !manualMessage) {
      setManualError('Telefon ve mesaj gereklidir')
      return
    }

    if (manualMessage.length > 917) {
      setManualError('Mesaj çok uzun (max 917 karakter)')
      return
    }

    try {
      setSendingManual(true)
      const result = await sendManualSMS({
        phone,
        message: manualMessage,
        customerId: selectedCustomer?.id,
        recipientName: selectedCustomer?.ad_soyad,
      })

      if (result.success) {
        setManualSuccess('SMS başarıyla gönderildi!')
        setManualMessage('')
        setSelectedCustomer(null)
        setManualPhone('')
        loadData() // Reload logs
      } else {
        setManualError(result.error || 'SMS gönderilemedi')
      }
    } catch (error: any) {
      setManualError(error.message || 'Bir hata oluştu')
    } finally {
      setSendingManual(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async (logId: number) => {
    try {
      const result = await updateSMSStatus(logId)
      if (result.success) {
        loadData() // Reload to show updated status
      } else {
        alert(result.error || 'Durum güncellenemedi')
      }
    } catch (error: any) {
      alert(error.message || 'Bir hata oluştu')
    }
  }

  // Get status badge
  const getStatusBadge = (log: SMSLog) => {
    if (log.delivery_status === '1') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> İletildi</Badge>
    } else if (log.status === 'failed') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Başarısız</Badge>
    } else if (log.status === 'sent') {
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Gönderildi</Badge>
    } else {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Bekliyor</Badge>
    }
  }

  if (authLoading || !user || user.role?.name !== 'superadmin') {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SMS Yönetimi</h1>
          <p className="text-slate-600 mt-1">Gönderilen SMS'leri görüntüleyin ve yeni SMS gönderin</p>
        </div>
        <MessageSquare className="h-8 w-8 text-blue-600" />
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Toplam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Gönderildi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">İletildi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Bekliyor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Başarısız</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual SMS Send Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Manuel SMS Gönder
          </CardTitle>
          <CardDescription>Müşterilere veya herhangi bir numaraya SMS gönderin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {manualError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{manualError}</AlertDescription>
            </Alert>
          )}
          {manualSuccess && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{manualSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-select">Müşteri Seç (Opsiyonel)</Label>
              <div className="relative">
                <Input
                  placeholder="Müşteri ara..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="mb-2"
                />
                {customers.length > 0 && customerSearch && (
                  <div className="absolute z-10 w-full max-h-60 overflow-y-auto bg-white border rounded-md shadow-lg">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setCustomerSearch(customer.ad_soyad)
                          setManualPhone(customer.telefon)
                        }}
                      >
                        <div className="font-medium">{customer.ad_soyad}</div>
                        <div className="text-sm text-gray-600">{customer.telefon}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="p-2 bg-blue-50 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedCustomer.ad_soyad}</div>
                    <div className="text-sm text-gray-600">{selectedCustomer.telefon}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setCustomerSearch('')
                      setManualPhone('')
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-phone">Veya Manuel Numara Gir</Label>
              <Input
                id="manual-phone"
                placeholder="05XX XXX XX XX"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                disabled={!!selectedCustomer}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-message">Mesaj ({manualMessage.length}/917)</Label>
            <Textarea
              id="manual-message"
              placeholder="SMS mesajınızı buraya yazın..."
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              maxLength={917}
              rows={5}
            />
          </div>

          <Button
            onClick={handleManualSend}
            disabled={sendingManual}
            className="w-full md:w-auto"
          >
            {sendingManual ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                SMS Gönder
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* SMS Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Gönderilen SMS'ler</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Telefon veya isim ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="sent">Gönderildi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="pending">Bekliyor</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
              <p className="text-slate-600 mt-2">Yükleniyor...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Henüz SMS kaydı bulunmuyor</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Alıcı</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Telefon</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Mesaj</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Durum</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Tarih</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{log.recipient_name || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{log.recipient_phone}</td>
                        <td className="p-3 text-sm max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="p-3">{getStatusBadge(log)}</td>
                        <td className="p-3 text-sm text-slate-600">
                          {new Date(log.sent_at).toLocaleString('tr-TR')}
                        </td>
                        <td className="p-3">
                          {log.job_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(log.id)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Güncelle
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Sayfa {currentPage} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

