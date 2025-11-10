<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    public function index(Request $request)
    {
        $query = Claim::with(['policy', 'customer', 'handler']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('claim_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('ad_soyad', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->byStatus($request->status);
        }

        if ($request->has('limit') && $request->limit) {
            $query->limit((int)$request->limit);
        }

        $claims = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $claims,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'customer_id' => 'required|exists:customers,id',
            'claim_number' => 'nullable|string|unique:claims',
            'claim_date' => 'required|date',
            'incident_date' => 'required|date',
            'description' => 'required|string',
            'claim_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,under_review,approved,rejected,paid,closed',
        ]);

        $claim = Claim::create($validated);
        $claim->load(['policy', 'customer']);

        return response()->json([
            'success' => true,
            'data' => $claim,
            'message' => 'Hasar kaydı başarıyla oluşturuldu.'
        ], 201);
    }

    public function show(string $id)
    {
        $claim = Claim::with(['policy', 'customer', 'handler'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $claim,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $claim = Claim::findOrFail($id);

        $validated = $request->validate([
            'claim_number' => 'nullable|string|unique:claims,claim_number,' . $id,
            'claim_date' => 'sometimes|date',
            'incident_date' => 'sometimes|date',
            'description' => 'sometimes|string',
            'claim_amount' => 'nullable|numeric|min:0',
            'approved_amount' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:pending,under_review,approved,rejected,paid,closed',
            'rejection_reason' => 'nullable|string',
        ]);

        $claim->update($validated);
        $claim->load(['policy', 'customer', 'handler']);

        return response()->json([
            'success' => true,
            'data' => $claim,
            'message' => 'Hasar kaydı başarıyla güncellendi.'
        ]);
    }

    public function destroy(string $id)
    {
        $claim = Claim::findOrFail($id);
        $claim->delete();

        return response()->json([
            'success' => true,
            'message' => 'Hasar kaydı başarıyla silindi.'
        ]);
    }

    public function getPending()
    {
        $claims = Claim::with(['policy', 'customer'])
            ->pending()
            ->orderBy('claim_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $claims,
        ]);
    }
}

