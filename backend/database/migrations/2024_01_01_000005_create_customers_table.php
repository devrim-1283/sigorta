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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('ad_soyad');
            $table->string('tc_no', 11)->unique();
            $table->string('telefon', 20);
            $table->string('email')->nullable();
            $table->string('plaka', 20);
            $table->date('hasar_tarihi');
            $table->foreignId('file_type_id')->constrained('file_types')->onDelete('restrict');
            $table->foreignId('dealer_id')->nullable()->constrained('dealers')->onDelete('set null');
            $table->enum('başvuru_durumu', [
                'İnceleniyor',
                'Başvuru Aşamasında',
                'Dava Aşamasında',
                'Onaylandı',
                'Tamamlandı',
                'Beklemede',
                'Evrak Aşamasında',
                'Reddedildi'
            ])->default('Evrak Aşamasında');
            $table->enum('evrak_durumu', ['Tamam', 'Eksik'])->default('Eksik');
            $table->boolean('dosya_kilitli')->default(false);
            $table->text('dosya_kapanma_nedeni')->nullable();
            $table->timestamp('dosya_kapanma_tarihi')->nullable();
            $table->text('notlar')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};

