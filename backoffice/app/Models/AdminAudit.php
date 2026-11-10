<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminAudit extends Model
{
    protected $fillable = [
        'admin_nome',
        'admin_email',
        'acao',
        'tipo_alvo',
        'alvo_id',
        'detalhes',
    ];

    protected function casts(): array
    {
        return [
            'detalhes' => 'array',
        ];
    }
}