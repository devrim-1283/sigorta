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
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('policy_number')->unique()->nullable();
            $table->string('policy_type'); // Kasko, Trafik, Sağlık, etc.
            $table->string('company'); // Insurance company name
            $table->decimal('premium', 10, 2); // Prim bedeli
            $table->decimal('coverage_amount', 12, 2)->nullable(); // Teminat tutarı
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'pending', 'expired', 'cancelled'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policies');
    }
};

