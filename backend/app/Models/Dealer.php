<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dealer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'dealer_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'city',
        'tax_number',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the users for this dealer.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the customers for this dealer.
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * Scope to get only active dealers.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get total customers count for this dealer.
     */
    public function getTotalCustomersAttribute(): int
    {
        return $this->customers()->count();
    }

    /**
     * Get active customers count for this dealer.
     */
    public function getActiveCustomersAttribute(): int
    {
        return $this->customers()->where('dosya_kilitli', false)->count();
    }
}

