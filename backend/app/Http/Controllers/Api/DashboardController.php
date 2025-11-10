<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Customer;
use App\Models\Dealer;
use App\Models\Document;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Policy;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        
        // Base stats
        $stats = [
            'total_customers' => Customer::count(),
            'total_dealers' => Dealer::active()->count(),
            'total_documents' => Document::count(),
            'total_payments' => Payment::count(),
            'total_policies' => Policy::count(),
            'active_policies' => Policy::active()->count(),
            'total_claims' => Claim::count(),
            'active_claims' => Claim::whereIn('status', ['pending', 'under_review', 'approved'])->count(),
            'active_customers' => Customer::open()->count(),
            'unread_notifications' => Notification::where('user_id', $user->id)->unread()->count(),
            'pending_payments' => Payment::pending()->count(),
            'pending_claims' => Claim::pending()->count(),
            'closed_files_today' => Customer::whereDate('dosya_kapanma_tarihi', today())->count(),
        ];

        // Recent customers
        $recentCustomersQuery = Customer::with(['fileType', 'dealer'])
            ->orderBy('created_at', 'desc')
            ->limit(5);

        // Filter for dealers
        if ($user->hasRole('bayi') && $user->dealer_id) {
            $recentCustomersQuery->where('dealer_id', $user->dealer_id);
            $stats['total_customers'] = Customer::where('dealer_id', $user->dealer_id)->count();
            $stats['active_customers'] = Customer::where('dealer_id', $user->dealer_id)->open()->count();
        }

        $stats['recent_customers'] = $recentCustomersQuery->get();

        // Recent documents
        $stats['recent_documents'] = Document::with(['customer', 'uploader'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json($stats);
    }
}

