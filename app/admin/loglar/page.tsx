'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  Database,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: number
  user_id: number | null
  user_name: string | null
  user_role: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  description: string
  old_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface Stats {
  totalLogs: number
  todayLogs: number
  weekLogs: number
  monthLogs: number
  loginCount: number
  failedLoginCount: number
  actionCounts: Array<{ action: string; count: number }>
  entityCounts: Array<{ entity_type: string; count: number }>
  topUsers: Array<{ user_name: string; user_role: string; count: number }>
}

export default function LoglarPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntityType, setFilterEntityType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const { toast } = useToast()

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filterAction && filterAction !== 'all') params.append('action', filterAction)
      if (filterEntityType && filterEntityType !== 'all') params.append('entityType', filterEntityType)

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Loglar yüklenemedi')
      }

      setLogs(data.logs)
      setTotalPages(data.pagination.totalPages)
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Loglar yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'İstatistikler yüklenemedi')
      }

      setStats(data)
    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [currentPage, filterAction, filterEntityType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLogs()
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-green-500'
      case 'LOGOUT': return 'bg-gray-500'
      case 'LOGIN_FAILED': return 'bg-red-500'
      case 'CREATE': return 'bg-blue-500'
      case 'UPDATE': return 'bg-yellow-500'
      case 'DELETE': return 'bg-red-600'
      case 'CLOSE_FILE': return 'bg-purple-500'
      case 'UPLOAD': return 'bg-indigo-500'
      default: return 'bg-gray-400'
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN': 'Giriş',
      'LOGOUT': 'Çıkış',
      'LOGIN_FAILED': 'Başarısız Giriş',
      'CREATE': 'Oluşturma',
      'UPDATE': 'Güncelleme',
      'DELETE': 'Silme',
      'CLOSE_FILE': 'Dosya Kapatma',
      'UPLOAD': 'Yükleme',
      'DOWNLOAD': 'İndirme',
      'APPROVE': 'Onaylama',
      'REJECT': 'Reddetme',
      'PASSWORD_RESET': 'Şifre Sıfırlama',
      'PASSWORD_CHANGE': 'Şifre Değiştirme',
    }
    return labels[action] || action
  }

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      'AUTH': 'Kimlik Doğrulama',
      'CUSTOMER': 'Müşteri',
      'DEALER': 'Bayi',
      'USER': 'Kullanıcı',
      'DOCUMENT': 'Evrak',
      'PAYMENT': 'Ödeme',
      'NOTE': 'Not',
      'SYSTEM': 'Sistem',
    }
    return labels[entityType] || entityType
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#0B3D91" }}>
            Sistem Logları
          </h1>
          <p className="text-muted-foreground mt-1">
            Tüm sistem aktivitelerini görüntüleyin ve takip edin
          </p>
        </div>
        <Button
          onClick={() => {
            fetchLogs()
            fetchStats()
          }}
          className="rounded-2xl"
          style={{ backgroundColor: "#0B3D91" }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Log</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString('tr-TR')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bu ay: {stats.monthLogs.toLocaleString('tr-TR')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugün</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayLogs.toLocaleString('tr-TR')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bu hafta: {stats.weekLogs.toLocaleString('tr-TR')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Başarılı Giriş</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.loginCount.toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-red-600 mt-1">
                Başarısız: {stats.failedLoginCount.toLocaleString('tr-TR')}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivite</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.actionCounts.length > 0 ? getActionLabel(stats.actionCounts[0].action) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En çok kullanılan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="rounded-2xl border-2">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Kullanıcı adı, açıklama veya varlık adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-2xl"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-[200px] rounded-2xl">
                <SelectValue placeholder="İşlem Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="LOGIN">Giriş</SelectItem>
                <SelectItem value="LOGOUT">Çıkış</SelectItem>
                <SelectItem value="LOGIN_FAILED">Başarısız Giriş</SelectItem>
                <SelectItem value="CREATE">Oluşturma</SelectItem>
                <SelectItem value="UPDATE">Güncelleme</SelectItem>
                <SelectItem value="DELETE">Silme</SelectItem>
                <SelectItem value="CLOSE_FILE">Dosya Kapatma</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntityType} onValueChange={setFilterEntityType}>
              <SelectTrigger className="w-full md:w-[200px] rounded-2xl">
                <SelectValue placeholder="Varlık Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Varlıklar</SelectItem>
                <SelectItem value="AUTH">Kimlik Doğrulama</SelectItem>
                <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                <SelectItem value="DEALER">Bayi</SelectItem>
                <SelectItem value="USER">Kullanıcı</SelectItem>
                <SelectItem value="DOCUMENT">Evrak</SelectItem>
                <SelectItem value="PAYMENT">Ödeme</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="rounded-2xl" style={{ backgroundColor: "#0B3D91" }}>
              <Search className="mr-2 h-4 w-4" />
              Ara
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="rounded-2xl border-2">
        <CardHeader>
          <CardTitle>Log Kayıtları</CardTitle>
          <CardDescription>
            Toplam {logs.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Log kaydı bulunamadı
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Varlık</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Detay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{log.user_name || 'Sistem'}</p>
                          {log.user_role && (
                            <p className="text-xs text-muted-foreground">{log.user_role}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getActionBadgeColor(log.action)} text-white rounded-full`}
                        >
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{getEntityTypeLabel(log.entity_type)}</p>
                          {log.entity_name && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {log.entity_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[300px]">
                          {log.description}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                          className="rounded-xl"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              <span className="text-sm text-muted-foreground">
                Sayfa {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log Detayları</DialogTitle>
            <DialogDescription>
              Log ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Tarih</p>
                  <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Kullanıcı</p>
                  <p className="text-sm">{selectedLog.user_name || 'Sistem'}</p>
                  {selectedLog.user_role && (
                    <p className="text-xs text-muted-foreground">{selectedLog.user_role}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">İşlem</p>
                  <Badge className={`${getActionBadgeColor(selectedLog.action)} text-white rounded-full`}>
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Varlık Türü</p>
                  <p className="text-sm">{getEntityTypeLabel(selectedLog.entity_type)}</p>
                </div>
                {selectedLog.entity_name && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Varlık Adı</p>
                    <p className="text-sm">{selectedLog.entity_name}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">IP Adresi</p>
                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Açıklama</p>
                <p className="text-sm">{selectedLog.description}</p>
              </div>

              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Eski Değerler</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Yeni Değerler</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Kullanıcı Aracısı</p>
                  <p className="text-xs font-mono break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

