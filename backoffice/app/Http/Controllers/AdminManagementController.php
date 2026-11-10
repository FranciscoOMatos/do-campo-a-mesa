<?php

namespace App\Http\Controllers;

use App\Models\AdminAudit;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Http;

class AdminManagementController extends Controller
{
    private function api()
    {
        return Http::baseUrl(
            config('services.node_api.url')
        )
            ->acceptJson()
            ->withToken(
                session('admin_token')
            );
    }

    private function registarAuditoria(
        string $acao,
        string $tipoAlvo,
        string $alvoId,
        array $detalhes = []
    ): void {
        $admin = session(
            'admin_user',
            []
        );

        AdminAudit::create([
            'admin_nome' =>
                $admin['nome'] ?? 'Administração',

            'admin_email' =>
                $admin['email'] ?? null,

            'acao' =>
                $acao,

            'tipo_alvo' =>
                $tipoAlvo,

            'alvo_id' =>
                $alvoId,

            'detalhes' =>
                $detalhes,
        ]);
    }

    public function validarProdutor(
        string $id,
        string $decisao
    ): RedirectResponse {
        if (! session()->has('admin_token')) {
            return redirect()
                ->route('login');
        }

        if (! in_array(
            $decisao,
            ['aprovar', 'rejeitar'],
            true
        )) {
            abort(404);
        }

        $aprovado =
            $decisao === 'aprovar';

        try {
            $resposta =
                $this
                    ->api()
                    ->patch(
                        "/admin/produtores/{$id}/validacao",
                        [
                            'aprovado' =>
                                $aprovado,
                        ]
                    );
        } catch (ConnectionException) {
            return back()->with(
                'erro',
                'Não foi possível contactar a API.'
            );
        }

        if (! $resposta->successful()) {
            return back()->with(
                'erro',
                'Não foi possível atualizar o produtor.'
            );
        }

        $this->registarAuditoria(
            $aprovado
                ? 'aprovar_produtor'
                : 'rejeitar_produtor',

            'produtor',
            $id,

            [
                'aprovado' =>
                    $aprovado,
            ]
        );

        return back()->with(
            'sucesso',
            $aprovado
                ? 'Produtor aprovado com sucesso.'
                : 'Produtor rejeitado com sucesso.'
        );
    }

    public function moderarReview(
        string $id,
        string $acao
    ): RedirectResponse {
        if (! session()->has('admin_token')) {
            return redirect()
                ->route('login');
        }

        if (! in_array(
            $acao,
            ['mostrar', 'ocultar'],
            true
        )) {
            abort(404);
        }

        $visivel =
            $acao === 'mostrar';

        try {
            $resposta =
                $this
                    ->api()
                    ->patch(
                        "/admin/reviews/{$id}",
                        [
                            'visivel' =>
                                $visivel,
                        ]
                    );
        } catch (ConnectionException) {
            return back()->with(
                'erro',
                'Não foi possível contactar a API.'
            );
        }

        if (! $resposta->successful()) {
            return back()->with(
                'erro',
                'Não foi possível moderar a avaliação.'
            );
        }

        $this->registarAuditoria(
            $visivel
                ? 'mostrar_avaliacao'
                : 'ocultar_avaliacao',

            'avaliacao',
            $id,

            [
                'visivel' =>
                    $visivel,
            ]
        );

        return back()->with(
            'sucesso',
            $visivel
                ? 'Avaliação tornada visível.'
                : 'Avaliação ocultada.'
        );
    }
}