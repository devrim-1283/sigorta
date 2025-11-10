<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function index(Request $request)
    {
        $query = Policy::with('customer');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('policy_number', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
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

        $policies = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $policies,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'policy_number' => 'nullable|string|unique:policies',
            'policy_type' => 'required|string',
            'company' => 'required|string',
            'premium' => 'required|numeric|min:0',
            'coverage_amount' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'nullable|in:active,pending,expired,cancelled',
            'notes' => 'nullable|string',
        ]);

        $policy = Policy::create($validated);
        $policy->load('customer');

        return response()->json([
            'success' => true,
            'data' => $policy,
            'message' => 'Poliçe başarıyla oluşturuldu.'
        ], 201);
    }

    public function show(string $id)
    {
        $policy = Policy::with(['customer', 'claims'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $policy,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $policy = Policy::findOrFail($id);

        $validated = $request->validate([
            'policy_number' => 'nullable|string|unique:policies,policy_number,' . $id,
            'policy_type' => 'sometimes|string',
            'company' => 'sometimes|string',
            'premium' => 'sometimes|numeric|min:0',
            'coverage_amount' => 'nullable|numeric|min:0',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'status' => 'sometimes|in:active,pending,expired,cancelled',
            'notes' => 'nullable|string',
        ]);

        $policy->update($validated);
        $policy->load('customer');

        return response()->json([
            'success' => true,
            'data' => $policy,
            'message' => 'Poliçe başarıyla güncellendi.'
        ]);
    }

    public function destroy(string $id)
    {
        $policy = Policy::findOrFail($id);
        $policy->delete();

        return response()->json([
            'success' => true,
            'message' => 'Poliçe başarıyla silindi.'
        ]);
    }

    public function getRecent(Request $request)
    {
        $limit = $request->get('limit', 6);
        $policies = Policy::with('customer')
            ->recent($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $policies,
        ]);
    }
}

