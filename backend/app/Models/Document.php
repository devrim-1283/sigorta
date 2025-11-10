<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'belge_adi',
        'dosya_yolu',
        'dosya_adi_orijinal',
        'mime_type',
        'dosya_boyutu',
        'tip',
        'durum',
        'red_nedeni',
        'uploaded_by',
        'onay_tarihi',
        'onaylayan_id',
    ];

    protected $casts = [
        'onay_tarihi' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the customer that owns the document.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user who uploaded the document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the user who approved the document.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'onaylayan_id');
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('durum', $status);
    }

    /**
     * Scope to get pending documents.
     */
    public function scopePending($query)
    {
        return $query->where('durum', 'Beklemede');
    }

    /**
     * Scope to get approved documents.
     */
    public function scopeApproved($query)
    {
        return $query->where('durum', 'Onaylandı');
    }

    /**
     * Approve the document.
     */
    public function approve(int $approverId): void
    {
        $this->update([
            'durum' => 'Onaylandı',
            'onay_tarihi' => now(),
            'onaylayan_id' => $approverId,
            'red_nedeni' => null,
        ]);
    }

    /**
     * Reject the document.
     */
    public function reject(string $reason): void
    {
        $this->update([
            'durum' => 'Reddedildi',
            'red_nedeni' => $reason,
            'onay_tarihi' => null,
            'onaylayan_id' => null,
        ]);
    }

    /**
     * Get the full storage URL for the document.
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->dosya_yolu);
    }

    /**
     * Get human-readable file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        if (!$this->dosya_boyutu) {
            return 'N/A';
        }

        $bytes = $this->dosya_boyutu;
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}

