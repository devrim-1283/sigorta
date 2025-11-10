<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'tarih',
        'tutar',
        'açıklama',
        'durum',
        'ödeme_yöntemi',
        'referans_no',
        'kaydeden_id',
    ];

    protected $casts = [
        'tarih' => 'date',
        'tutar' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the customer that owns the payment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user who recorded the payment.
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kaydeden_id');
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('durum', $status);
    }

    /**
     * Scope to get paid payments.
     */
    public function scopePaid($query)
    {
        return $query->where('durum', 'Ödendi');
    }

    /**
     * Scope to get pending payments.
     */
    public function scopePending($query)
    {
        return $query->where('durum', 'Bekliyor');
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('tarih', [$startDate, $endDate]);
    }

    /**
     * Mark payment as paid.
     */
    public function markAsPaid(): void
    {
        $this->update(['durum' => 'Ödendi']);
    }

    /**
     * Mark payment as cancelled.
     */
    public function cancel(): void
    {
        $this->update(['durum' => 'İptal']);
    }

    /**
     * Get formatted amount with currency.
     */
    public function getFormattedAmountAttribute(): string
    {
        return '₺' . number_format($this->tutar, 2, ',', '.');
    }
}

