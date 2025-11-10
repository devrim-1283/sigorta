<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Customer;
use App\Models\Dealer;
use App\Models\Document;
use App\Models\FileType;
use App\Models\Payment;
use App\Models\Policy;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function getStats()
    {
        $stats = [
            'customers' => [
                'total' => Customer::count(),
                'active' => Customer::open()->count(),
                'closed' => Customer::closed()->count(),
                'by_status' => Customer::selectRaw('başvuru_durumu, COUNT(*) as count')
                    ->groupBy('başvuru_durumu')
                    ->get(),
            ],
            'policies' => [
                'total' => Policy::count(),
                'active' => Policy::active()->count(),
                'expired' => Policy::expired()->count(),
                'total_premium' => (float) Policy::sum('premium'),
            ],
            'claims' => [
                'total' => Claim::count(),
                'pending' => Claim::pending()->count(),
                'approved' => Claim::approved()->count(),
                'total_amount' => (float) Claim::sum('claim_amount'),
                'approved_amount' => (float) Claim::sum('approved_amount'),
            ],
            'payments' => [
                'total' => Payment::count(),
                'paid' => Payment::paid()->count(),
                'pending' => Payment::pending()->count(),
                'total_amount' => (float) Payment::sum('tutar'),
                'paid_amount' => (float) Payment::paid()->sum('tutar'),
            ],
            'documents' => [
                'total' => Document::count(),
                'pending' => Document::pending()->count(),
                'approved' => Document::approved()->count(),
            ],
            'dealers' => [
                'total' => Dealer::count(),
                'active' => Dealer::active()->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function getFileTypeStats()
    {
        $fileTypes = FileType::withCount('customers')->get();

        return response()->json([
            'success' => true,
            'data' => $fileTypes,
        ]);
    }

    public function generateReport(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:dashboard,customers,policies,claims,payments',
            'format' => 'nullable|in:pdf,excel,csv',
            'date_range' => 'nullable|string',
        ]);

        // Placeholder for actual report generation
        // In a real scenario, you would use packages like:
        // - barryvdh/laravel-dompdf for PDF
        // - maatwebsite/excel for Excel
        
        $reportData = match ($validated['type']) {
            'dashboard' => $this->getStats()->getData(),
            'customers' => ['data' => Customer::with(['fileType', 'dealer'])->get()],
            'policies' => ['data' => Policy::with('customer')->get()],
            'claims' => ['data' => Claim::with(['policy', 'customer'])->get()],
            'payments' => ['data' => Payment::with('customer')->get()],
            default => [],
        };

        return response()->json([
            'success' => true,
            'message' => 'Rapor oluşturuldu.',
            'data' => $reportData,
            'download_url' => null, // Would be actual file URL
        ]);
    }

    public function getReports()
    {
        // Placeholder for saved reports list
        // In a real scenario, you would have a reports table
        
        return response()->json([
            'success' => true,
            'data' => [],
            'message' => 'Henüz kaydedilmiş rapor bulunmamaktadır.',
        ]);
    }
}

