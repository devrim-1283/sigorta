<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Claim extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'policy_id',
        'customer_id',
        'claim_number',
        'claim_date',
        'incident_date',
        'description',
        'claim_amount',
        'approved_amount',
        'status',
        'rejection_reason',
        'handled_by',
        'approved_at',
        'paid_at',
    ];

    protected $casts = [
        'claim_date' => 'date',
        'incident_date' => 'date',
        'claim_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the policy that owns the claim.
     */
    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    /**
     * Get the customer that owns the claim.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user handling the claim.
     */
    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get pending claims.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved claims.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get under review claims.
     */
    public function scopeUnderReview($query)
    {
        return $query->where('status', 'under_review');
    }

    /**
     * Scope to get recent claims.
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    /**
     * Approve the claim.
     */
    public function approve(float $approvedAmount, int $handlerId): void
    {
        $this->update([
            'status' => 'approved',
            'approved_amount' => $approvedAmount,
            'approved_at' => now(),
            'handled_by' => $handlerId,
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject the claim.
     */
    public function reject(string $reason, int $handlerId): void
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'handled_by' => $handlerId,
            'approved_amount' => null,
            'approved_at' => null,
        ]);
    }

    /**
     * Mark claim as paid.
     */
    public function markAsPaid(): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    /**
     * Get formatted claim amount.
     */
    public function getFormattedClaimAmountAttribute(): string
    {
        return $this->claim_amount ? '₺' . number_format($this->claim_amount, 2, ',', '.') : 'N/A';
    }

    /**
     * Get formatted approved amount.
     */
    public function getFormattedApprovedAmountAttribute(): string
    {
        return $this->approved_amount ? '₺' . number_format($this->approved_amount, 2, ',', '.') : 'N/A';
    }
}

