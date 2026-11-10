<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_audits', function (Blueprint $table) {
            $table->id();

            $table->string('admin_nome');
            $table->string('admin_email')->nullable();

            $table->string('acao');
            $table->string('tipo_alvo');
            $table->string('alvo_id');

            $table->json('detalhes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_audits');
    }
};