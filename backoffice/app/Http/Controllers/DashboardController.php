<?php

namespace App\Http\Controllers;

use App\Models\AdminAudit;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View|RedirectResponse
    {
        $token = session('admin_token');

        if (! $token) {
            return redirect()->route('login');
        }

        $auditorias = AdminAudit::query()
            ->latest()
            ->limit(10)
            ->get();

        try {
            $api = Http::baseUrl(
                config('services.node_api.url')
            )
                ->acceptJson()
                ->withToken($token);

            $estatisticas =
                $api->get('/admin/estatisticas');

            $produtores =
                $api->get('/admin/produtores/pendentes');

            $reviews =
                $api->get('/admin/reviews/denunciadas');

            $leiloes =
                Http::baseUrl(
                    config('services.node_api.url')
                )
                    ->acceptJson()
                    ->get(
                        '/auctions',
                        [
                            'estado' => 'ativo',
                        ]
                    );

            if (
                $estatisticas->unauthorized() ||
                $estatisticas->forbidden()
            ) {
                session()->invalidate();

                return redirect()
                    ->route('login');
            }

            return view(
                'dashboard',
                [
                    'admin' =>
                        session('admin_user'),

                    'estatisticas' =>
                        $estatisticas->successful()
                            ? $estatisticas->json()
                            : [],

                    'produtores' =>
                        $produtores->successful()
                            ? $produtores->json()
                            : [],

                    'reviews' =>
                        $reviews->successful()
                            ? $reviews->json()
                            : [],

                    'leiloes' =>
                        $leiloes->successful()
                            ? $leiloes->json()
                            : [],

                    'auditorias' =>
                        $auditorias,
                ]
            );
        } catch (ConnectionException) {
            return view(
                'dashboard',
                [
                    'admin' =>
                        session('admin_user'),

                    'estatisticas' => [],
                    'produtores' => [],
                    'reviews' => [],
                    'leiloes' => [],

                    'auditorias' =>
                        $auditorias,

                    'erroApi' =>
                        'Não foi possível contactar a API Node.',
                ]
            );
        }
    }
}