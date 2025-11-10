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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->date('tarih');
            $table->decimal('tutar', 10, 2);
            $table->text('açıklama')->nullable();
            $table->enum('durum', ['Ödendi', 'Bekliyor', 'İptal'])->default('Bekliyor');
            $table->string('ödeme_yöntemi')->nullable(); // Banka Havalesi, Kredi Kartı, etc.
            $table->string('referans_no')->nullable();
            $table->foreignId('kaydeden_id')->constrained('users')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

