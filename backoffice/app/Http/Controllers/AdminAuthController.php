<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\View\View;

class AdminAuthController extends Controller
{
    public function showLogin(Request $request): View|RedirectResponse
    {
        if ($request->session()->has('admin_token')) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $dados = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        try {
            $resposta = Http::baseUrl(
                config('services.node_api.url')
            )
                ->acceptJson()
                ->post('/auth/login', $dados);
        } catch (ConnectionException) {
            return back()
                ->withErrors([
                    'email' => 'Não foi possível contactar a API.',
                ])
                ->onlyInput('email');
        }

        if (! $resposta->successful()) {
            return back()
                ->withErrors([
                    'email' => 'Credenciais inválidas.',
                ])
                ->onlyInput('email');
        }

        $payload = $resposta->json();
        $utilizador = $payload['utilizador'] ?? null;
        $token = $payload['token'] ?? null;

        if (
            ! $utilizador ||
            ! $token ||
            ($utilizador['papel'] ?? null) !== 'admin'
        ) {
            return back()
                ->withErrors([
                    'email' => 'Acesso reservado a administradores.',
                ])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        $request->session()->put([
            'admin_token' => $token,
            'admin_user' => $utilizador,
        ]);

        return redirect()->route('dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}