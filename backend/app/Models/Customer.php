<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ad_soyad',
        'tc_no',
        'telefon',
        'email',
        'plaka',
        'hasar_tarihi',
        'file_type_id',
        'dealer_id',
        'başvuru_durumu',
        'evrak_durumu',
        'dosya_kilitli',
        'dosya_kapanma_nedeni',
        'dosya_kapanma_tarihi',
        'notlar',
    ];

    protected $casts = [
        'hasar_tarihi' => 'date',
        'dosya_kilitli' => 'boolean',
        'dosya_kapanma_tarihi' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the file type that owns the customer.
     */
    public function fileType(): BelongsTo
    {
        return $this->belongsTo(FileType::class);
    }

    /**
     * Get the dealer that owns the customer.
     */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /**
     * Get the documents for the customer.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Get the payments for the customer.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the notes for the customer.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get the policies for the customer.
     */
    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }

    /**
     * Get the claims for the customer.
     */
    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    /**
     * Scope to filter by dealer.
     */
    public function scopeByDealer($query, int $dealerId)
    {
        return $query->where('dealer_id', $dealerId);
    }

    /**
     * Scope to filter by file type.
     */
    public function scopeByFileType($query, int $fileTypeId)
    {
        return $query->where('file_type_id', $fileTypeId);
    }

    /**
     * Scope to get only open files (not locked).
     */
    public function scopeOpen($query)
    {
        return $query->where('dosya_kilitli', false);
    }

    /**
     * Scope to get only closed files (locked).
     */
    public function scopeClosed($query)
    {
        return $query->where('dosya_kilitli', true);
    }

    /**
     * Scope to filter by application status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('başvuru_durumu', $status);
    }

    /**
     * Scope to search customers.
     */
    public function scopeSearch($query, string $searchTerm)
    {
        return $query->where(function ($q) use ($searchTerm) {
            $q->where('ad_soyad', 'like', "%{$searchTerm}%")
                ->orWhere('tc_no', 'like', "%{$searchTerm}%")
                ->orWhere('telefon', 'like', "%{$searchTerm}%")
                ->orWhere('plaka', 'like', "%{$searchTerm}%")
                ->orWhere('email', 'like', "%{$searchTerm}%");
        });
    }

    /**
     * Check if customer has missing documents.
     */
    public function hasMissingDocuments(): bool
    {
        return $this->evrak_durumu === 'Eksik';
    }

    /**
     * Close the customer file.
     */
    public function closeFile(?string $reason = null): void
    {
        $this->update([
            'dosya_kilitli' => true,
            'dosya_kapanma_nedeni' => $reason,
            'dosya_kapanma_tarihi' => now(),
        ]);
    }
}

