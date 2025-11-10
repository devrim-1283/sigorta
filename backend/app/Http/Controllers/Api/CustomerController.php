<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers
     */
    public function index(Request $request)
    {
        $query = Customer::with(['fileType', 'dealer', 'documents', 'payments']);

        // Filter by search term
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->byStatus($request->status);
        }

        // Filter by dealer (for dealer users)
        $user = $request->user();
        if ($user->hasRole('bayi') && $user->dealer_id) {
            $query->byDealer($user->dealer_id);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $customers = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Store a newly created customer
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ad_soyad' => 'required|string|max:255',
            'tc_no' => 'required|string|size:11|unique:customers',
            'telefon' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'plaka' => 'required|string|max:20',
            'hasar_tarihi' => 'required|date',
            'file_type_id' => 'required|exists:file_types,id',
            'dealer_id' => 'nullable|exists:dealers,id',
            'başvuru_durumu' => 'nullable|string',
            'evrak_durumu' => 'nullable|in:Tamam,Eksik',
        ]);

        $customer = Customer::create($validated);
        $customer->load(['fileType', 'dealer']);

        return response()->json([
            'success' => true,
            'data' => $customer,
            'message' => 'Müşteri başarıyla oluşturuldu.'
        ], 201);
    }

    /**
     * Display the specified customer
     */
    public function show(Request $request, string $id)
    {
        $customer = Customer::with([
            'fileType',
            'dealer',
            'documents.uploader',
            'payments.recorder',
            'notes.author',
            'policies',
            'claims'
        ])->findOrFail($id);

        // Check authorization for dealer users
        $user = $request->user();
        if ($user->hasRole('bayi') && $user->dealer_id !== $customer->dealer_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bu müşteriye erişim yetkiniz yok.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * Update the specified customer
     */
    public function update(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);

        // Check if file is locked
        if ($customer->dosya_kilitli) {
            return response()->json([
                'success' => false,
                'message' => 'Kapalı dosyalar düzenlenemez.'
            ], 403);
        }

        $validated = $request->validate([
            'ad_soyad' => 'sometimes|string|max:255',
            'tc_no' => 'sometimes|string|size:11|unique:customers,tc_no,' . $id,
            'telefon' => 'sometimes|string|max:20',
            'email' => 'nullable|email|max:255',
            'plaka' => 'sometimes|string|max:20',
            'hasar_tarihi' => 'sometimes|date',
            'file_type_id' => 'sometimes|exists:file_types,id',
            'dealer_id' => 'nullable|exists:dealers,id',
            'başvuru_durumu' => 'sometimes|string',
            'evrak_durumu' => 'sometimes|in:Tamam,Eksik',
        ]);

        $customer->update($validated);
        $customer->load(['fileType', 'dealer']);

        return response()->json([
            'success' => true,
            'data' => $customer,
            'message' => 'Müşteri başarıyla güncellendi.'
        ]);
    }

    /**
     * Remove the specified customer
     */
    public function destroy(string $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Müşteri başarıyla silindi.'
        ]);
    }

    /**
     * Close customer file
     */
    public function closeFile(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);

        if ($customer->dosya_kilitli) {
            return response()->json([
                'success' => false,
                'message' => 'Dosya zaten kapalı.'
            ], 400);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        $customer->closeFile($validated['reason'] ?? null);

        return response()->json([
            'success' => true,
            'data' => $customer,
            'message' => 'Dosya başarıyla kapatıldı.'
        ]);
    }

    /**
     * Add note to customer
     */
    public function addNote(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'içerik' => 'required|string',
            'is_important' => 'nullable|boolean',
        ]);

        $note = Note::create([
            'customer_id' => $customer->id,
            'içerik' => $validated['içerik'],
            'yazar_id' => $request->user()->id,
            'is_important' => $validated['is_important'] ?? false,
        ]);

        $note->load('author');

        return response()->json([
            'success' => true,
            'data' => $note,
            'message' => 'Not başarıyla eklendi.'
        ], 201);
    }
}

