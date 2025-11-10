<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('file_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // deger-kaybi, parca-iscilik, etc.
            $table->string('label'); // Display name
            $table->string('color', 7)->default('#3b82f6'); // Hex color code
            $table->text('description')->nullable();
            $table->json('required_documents')->nullable(); // JSON array of required doc types
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_types');
    }
};

