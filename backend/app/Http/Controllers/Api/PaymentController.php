<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        $payments = Payment::with(['customer', 'recorder'])
            ->orderBy('tarih', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'tarih' => 'required|date',
            'tutar' => 'required|numeric|min:0',
            'açıklama' => 'nullable|string',
            'durum' => 'nullable|in:Ödendi,Bekliyor,İptal',
            'ödeme_yöntemi' => 'nullable|string|max:100',
            'referans_no' => 'nullable|string|max:100',
        ]);

        $validated['kaydeden_id'] = $request->user()->id;

        $payment = Payment::create($validated);
        $payment->load(['customer', 'recorder']);

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Ödeme başarıyla kaydedildi.'
        ], 201);
    }

    public function show(string $id)
    {
        $payment = Payment::with(['customer', 'recorder'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $payment = Payment::findOrFail($id);

        $validated = $request->validate([
            'tarih' => 'sometimes|date',
            'tutar' => 'sometimes|numeric|min:0',
            'açıklama' => 'nullable|string',
            'durum' => 'sometimes|in:Ödendi,Bekliyor,İptal',
            'ödeme_yöntemi' => 'nullable|string|max:100',
            'referans_no' => 'nullable|string|max:100',
        ]);

        $payment->update($validated);
        $payment->load(['customer', 'recorder']);

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Ödeme başarıyla güncellendi.'
        ]);
    }

    public function destroy(string $id)
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ödeme başarıyla silindi.'
        ]);
    }
}

