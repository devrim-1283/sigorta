<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FileType extends Model
{
    protected $fillable = [
        'name',
        'label',
        'color',
        'description',
        'required_documents',
        'is_active',
    ];

    protected $casts = [
        'required_documents' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the customers for this file type.
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * Scope to get only active file types.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

