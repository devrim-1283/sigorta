<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * Display a listing of documents
     */
    public function index(Request $request)
    {
        $query = Document::with(['customer', 'uploader']);

        // Filter by search term
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('belge_adi', 'like', "%{$search}%")
                    ->orWhere('tip', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('ad_soyad', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('tip', $request->type);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->byStatus($request->status);
        }

        $documents = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    /**
     * Upload a new document
     */
    public function upload(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'belge_adi' => 'required|string|max:255',
            'tip' => 'required|string|max:100',
            'file' => 'required|file|max:10240', // Max 10MB
        ]);

        // Get the file
        $file = $request->file('file');
        
        // Generate unique filename
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        
        // Store file in documents directory
        $path = $file->storeAs('documents', $filename, 'public');

        // Create document record
        $document = Document::create([
            'customer_id' => $validated['customer_id'],
            'belge_adi' => $validated['belge_adi'],
            'dosya_yolu' => $path,
            'dosya_adi_orijinal' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'dosya_boyutu' => $file->getSize(),
            'tip' => $validated['tip'],
            'durum' => 'Beklemede',
            'uploaded_by' => $request->user()->id,
        ]);

        $document->load(['customer', 'uploader']);

        return response()->json([
            'success' => true,
            'data' => $document,
            'message' => 'Belge başarıyla yüklendi.'
        ], 201);
    }

    /**
     * Display the specified document
     */
    public function show(string $id)
    {
        $document = Document::with(['customer', 'uploader', 'approver'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $document,
        ]);
    }

    /**
     * Update the specified document
     */
    public function update(Request $request, string $id)
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'belge_adi' => 'sometimes|string|max:255',
            'tip' => 'sometimes|string|max:100',
            'durum' => 'sometimes|in:Onaylandı,Beklemede,Reddedildi',
            'red_nedeni' => 'nullable|string',
        ]);

        // If status is being changed to approved
        if (isset($validated['durum'])) {
            if ($validated['durum'] === 'Onaylandı') {
                $document->approve($request->user()->id);
            } elseif ($validated['durum'] === 'Reddedildi' && isset($validated['red_nedeni'])) {
                $document->reject($validated['red_nedeni']);
            } else {
                $document->update($validated);
            }
        } else {
            $document->update($validated);
        }

        $document->load(['customer', 'uploader', 'approver']);

        return response()->json([
            'success' => true,
            'data' => $document,
            'message' => 'Belge başarıyla güncellendi.'
        ]);
    }

    /**
     * Remove the specified document
     */
    public function destroy(string $id)
    {
        $document = Document::findOrFail($id);

        // Delete file from storage
        if (Storage::disk('public')->exists($document->dosya_yolu)) {
            Storage::disk('public')->delete($document->dosya_yolu);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Belge başarıyla silindi.'
        ]);
    }

    /**
     * Download the specified document
     */
    public function download(string $id)
    {
        $document = Document::findOrFail($id);

        if (!Storage::disk('public')->exists($document->dosya_yolu)) {
            return response()->json([
                'success' => false,
                'message' => 'Dosya bulunamadı.'
            ], 404);
        }

        return Storage::disk('public')->download(
            $document->dosya_yolu,
            $document->dosya_adi_orijinal
        );
    }

    /**
     * View the specified document (inline)
     */
    public function view(string $id)
    {
        $document = Document::findOrFail($id);

        if (!Storage::disk('public')->exists($document->dosya_yolu)) {
            return response()->json([
                'success' => false,
                'message' => 'Dosya bulunamadı.'
            ], 404);
        }

        return Storage::disk('public')->response(
            $document->dosya_yolu,
            $document->dosya_adi_orijinal
        );
    }
}

