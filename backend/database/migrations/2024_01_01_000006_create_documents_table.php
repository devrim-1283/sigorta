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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('belge_adi');
            $table->string('dosya_yolu'); // Storage path
            $table->string('dosya_adi_orijinal'); // Original filename
            $table->string('mime_type')->nullable();
            $table->integer('dosya_boyutu')->nullable(); // In bytes
            $table->string('tip'); // Document type: Kimlik, Ruhsat, etc.
            $table->enum('durum', ['Onaylandı', 'Beklemede', 'Reddedildi'])->default('Beklemede');
            $table->text('red_nedeni')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('onay_tarihi')->nullable();
            $table->foreignId('onaylayan_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};

