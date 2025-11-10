<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function getTransactions(Request $request)
    {
        $query = Payment::with(['customer', 'recorder']);

        if ($request->has('date_range') && $request->date_range) {
            // Parse date range (e.g., "last-30-days", "this-month")
            match ($request->date_range) {
                'today' => $query->whereDate('tarih', today()),
                'yesterday' => $query->whereDate('tarih', today()->subDay()),
                'last-7-days' => $query->whereDate('tarih', '>=', today()->subDays(7)),
                'last-30-days' => $query->whereDate('tarih', '>=', today()->subDays(30)),
                'this-month' => $query->whereMonth('tarih', now()->month)->whereYear('tarih', now()->year),
                'last-month' => $query->whereMonth('tarih', now()->subMonth()->month)->whereYear('tarih', now()->subMonth()->year),
                default => null,
            };
        }

        if ($request->has('type') && $request->type) {
            $query->where('durum', $request->type);
        }

        $transactions = $query->orderBy('tarih', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    public function getInvoices()
    {
        // Placeholder - would need invoice model
        $invoices = Payment::with('customer')
            ->where('durum', 'Ödendi')
            ->orderBy('tarih', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    public function createTransaction(Request $request)
    {
        // Redirect to PaymentController store method
        return app(PaymentController::class)->store($request);
    }

    public function getStats()
    {
        $totalRevenue = Payment::where('durum', 'Ödendi')->sum('tutar');
        $pendingPayments = Payment::where('durum', 'Bekliyor')->sum('tutar');
        $thisMonthRevenue = Payment::where('durum', 'Ödendi')
            ->whereMonth('tarih', now()->month)
            ->whereYear('tarih', now()->year)
            ->sum('tutar');
        $lastMonthRevenue = Payment::where('durum', 'Ödendi')
            ->whereMonth('tarih', now()->subMonth()->month)
            ->whereYear('tarih', now()->subMonth()->year)
            ->sum('tutar');

        $stats = [
            'total_revenue' => (float) $totalRevenue,
            'pending_payments' => (float) $pendingPayments,
            'this_month_revenue' => (float) $thisMonthRevenue,
            'last_month_revenue' => (float) $lastMonthRevenue,
            'total_transactions' => Payment::count(),
            'paid_count' => Payment::where('durum', 'Ödendi')->count(),
            'pending_count' => Payment::where('durum', 'Bekliyor')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}

