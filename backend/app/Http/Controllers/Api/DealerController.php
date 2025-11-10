<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dealer;
use Illuminate\Http\Request;

class DealerController extends Controller
{
    /**
     * Display a listing of dealers
     */
    public function index(Request $request)
    {
        $query = Dealer::with('users');

        // Filter by search term
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('dealer_name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $dealers = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $dealers,
        ]);
    }

    /**
     * Store a newly created dealer
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'dealer_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:50',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        $dealer = Dealer::create($validated);

        return response()->json([
            'success' => true,
            'data' => $dealer,
            'message' => 'Bayi başarıyla oluşturuldu.'
        ], 201);
    }

    /**
     * Display the specified dealer
     */
    public function show(string $id)
    {
        $dealer = Dealer::with(['users', 'customers'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $dealer,
        ]);
    }

    /**
     * Update the specified dealer
     */
    public function update(Request $request, string $id)
    {
        $dealer = Dealer::findOrFail($id);

        $validated = $request->validate([
            'dealer_name' => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:50',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        $dealer->update($validated);

        return response()->json([
            'success' => true,
            'data' => $dealer,
            'message' => 'Bayi başarıyla güncellendi.'
        ]);
    }

    /**
     * Remove the specified dealer
     */
    public function destroy(string $id)
    {
        $dealer = Dealer::findOrFail($id);
        
        // Check if dealer has active customers
        if ($dealer->customers()->where('dosya_kilitli', false)->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Aktif müşterileri olan bayi silinemez.'
            ], 400);
        }

        $dealer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bayi başarıyla silindi.'
        ]);
    }

    /**
     * Get dealer statistics
     */
    public function stats(string $id)
    {
        $dealer = Dealer::findOrFail($id);

        $stats = [
            'total_customers' => $dealer->customers()->count(),
            'active_customers' => $dealer->customers()->open()->count(),
            'closed_customers' => $dealer->customers()->closed()->count(),
            'total_users' => $dealer->users()->active()->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}

