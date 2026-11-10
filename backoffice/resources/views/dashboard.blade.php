<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Dashboard | Do Campo à Mesa</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f3f5f2;
            color: #1f2937;
        }

        header {
            background: #285c34;
            color: white;
            padding: 20px 32px;

            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }

        header h1 {
            margin: 0 0 4px;
            font-size: 1.5rem;
        }

        header p {
            margin: 0;
            color: #dce8df;
        }

        header button {
            border: 1px solid rgba(255, 255, 255, 0.5);
            background: transparent;
            color: white;
            border-radius: 8px;
            padding: 9px 14px;
            cursor: pointer;
        }

        main {
            width: min(1200px, calc(100% - 32px));
            margin: 28px auto 50px;
        }

        .erro {
            background: #fee2e2;
            color: #991b1b;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 24px;
        }

        .cards {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 14px;
            padding: 20px;
            box-shadow:
                0 5px 18px rgba(0, 0, 0, 0.05);
        }

        .card span {
            display: block;
            color: #6b7280;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .card strong {
            font-size: 2rem;
            color: #285c34;
        }

        section {
            background: white;
            border-radius: 14px;
            padding: 22px;
            margin-bottom: 22px;
            box-shadow:
                0 5px 18px rgba(0, 0, 0, 0.05);
        }

        section h2 {
            margin-top: 0;
            margin-bottom: 18px;
            font-size: 1.15rem;
        }

        .vazio {
            color: #6b7280;
            margin: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            text-align: left;
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }

        th {
            color: #4b5563;
            font-size: 0.85rem;
        }

        tbody tr:last-child td {
            border-bottom: 0;
        }

        .estado {
            display: inline-block;
            padding: 4px 9px;
            border-radius: 999px;
            background: #dcfce7;
            color: #166534;
            font-size: 0.8rem;
            font-weight: 700;
        }

        .denuncias {
            display: inline-block;
            padding: 4px 9px;
            border-radius: 999px;
            background: #fee2e2;
            color: #991b1b;
            font-size: 0.8rem;
            font-weight: 700;
        }

        @media (max-width: 900px) {
            .cards {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            section {
                overflow-x: auto;
            }
        }

        @media (max-width: 560px) {
            header {
                align-items: flex-start;
                flex-direction: column;
            }

            .cards {
                grid-template-columns: 1fr;
            }
        }
            .mensagem {
            padding: 14px 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 600;
        }

        .mensagem-sucesso {
            background: #dcfce7;
            color: #166534;
        }

        .mensagem-erro {
            background: #fee2e2;
            color: #991b1b;
        }

        .acoes {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .acoes form {
            margin: 0;
        }

        .botao-acao {
            border: 0;
            border-radius: 7px;
            padding: 7px 11px;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
        }

        .botao-aprovar,
        .botao-mostrar {
            background: #dcfce7;
            color: #166534;
        }

        .botao-rejeitar,
        .botao-ocultar {
            background: #fee2e2;
            color: #991b1b;
        }

    </style>
</head>

<body>
    <header>
        <div>
            <h1>Do Campo à Mesa</h1>

            <p>
                Backoffice ·
                {{ $admin['nome'] ?? 'Administração' }}
            </p>
        </div>

        <form
            method="POST"
            action="{{ route('logout') }}"
        >
            @csrf

            <button type="submit">
                Terminar sessão
            </button>
        </form>
    </header>

    <main>
        @isset($erroApi)
            <div class="erro" role="alert">
                {{ $erroApi }}
            </div>
        @endisset

        @if (session('sucesso'))
            <div class="mensagem mensagem-sucesso" role="status">
                {{ session('sucesso') }}
            </div>
        @endif

        @if (session('erro'))
            <div class="mensagem mensagem-erro" role="alert">
                {{ session('erro') }}
            </div>
        @endif

        <div class="cards">
            <article class="card">
                <span>Utilizadores</span>

                <strong>
                    {{ $estatisticas['utilizadores'] ?? 0 }}
                </strong>
            </article>

            <article class="card">
                <span>Produtores</span>

                <strong>
                    {{ $estatisticas['produtores'] ?? 0 }}
                </strong>
            </article>

            <article class="card">
                <span>Encomendas hoje</span>

                <strong>
                    {{ $estatisticas['encomendasHoje'] ?? 0 }}
                </strong>
            </article>

            <article class="card">
                <span>Leilões ativos</span>

                <strong>
                    {{ $estatisticas['leiloesAtivos'] ?? 0 }}
                </strong>
            </article>
        </div>

        <section>
            <h2>
                Produtores pendentes
                ({{ count($produtores) }})
            </h2>

            @if (count($produtores) === 0)
                <p class="vazio">
                    Não existem produtores pendentes.
                </p>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Exploração</th>
                            <th>Email</th>
                            <th>Localidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        @foreach ($produtores as $produtor)
                            <tr>
                                <td>
                                    {{ $produtor['nome'] ?? '—' }}
                                </td>

                                <td>
                                    {{
                                        $produtor['produtor']['nomeExploracao']
                                        ?? '—'
                                    }}
                                </td>

                                <td>
                                    {{ $produtor['email'] ?? '—' }}
                                </td>

                                <td>
                                    {{
                                        $produtor['produtor']['localidade']
                                        ?? '—'
                                    }}
                                </td>

                                <td>
                                    <div class="acoes">
                                        <form
                                            method="POST"
                                            action="{{ route('produtores.validar', [
                                                'id' => ($produtor['_id'] ?? $produtor['id']),
                                                'decisao' => 'aprovar'
                                            ]) }}"
                                        >
                                            @csrf

                                            <button
                                                class="botao-acao botao-aprovar"
                                                type="submit"
                                            >
                                                Aprovar
                                            </button>
                                        </form>

                                        <form
                                            method="POST"
                                            action="{{ route('produtores.validar', [
                                                'id' => ($produtor['_id'] ?? $produtor['id']),
                                                'decisao' => 'rejeitar'
                                            ]) }}"
                                        >
                                            @csrf

                                            <button
                                                class="botao-acao botao-rejeitar"
                                                type="submit"
                                            >
                                                Rejeitar
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section>
            <h2>
                Avaliações denunciadas
                ({{ count($reviews) }})
            </h2>

            @if (count($reviews) === 0)
                <p class="vazio">
                    Não existem avaliações denunciadas.
                </p>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Autor</th>
                            <th>Produtor</th>
                            <th>Produto</th>
                            <th>Classificação</th>
                            <th>Comentário</th>
                            <th>Denúncias</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        @foreach ($reviews as $review)
                            <tr>
                                <td>
                                    {{
                                        $review['autor']['nome']
                                        ?? '—'
                                    }}
                                </td>

                                <td>
                                    {{
                                        $review['produtor']['produtor']['nomeExploracao']
                                        ?? $review['produtor']['nome']
                                        ?? '—'
                                    }}
                                </td>

                                <td>
                                    {{
                                        $review['produto']['nome']
                                        ?? 'Avaliação do produtor'
                                    }}
                                </td>

                                <td>
                                    {{ $review['classificacao'] ?? '—' }}/5
                                </td>

                                <td>
                                    {{ $review['comentario'] ?? '—' }}
                                </td>

                                <td>
                                    <span class="denuncias">
                                        {{ $review['denuncias'] ?? 0 }}
                                    </span>
                                </td>

                                <td>
                                    <div class="acoes">
                                        @if ($review['visivel'] ?? true)
                                            <form
                                                method="POST"
                                                action="{{ route('reviews.moderar', [
                                                    'id' => ($review['_id'] ?? $review['id']),
                                                    'acao' => 'ocultar'
                                                ]) }}"
                                            >
                                                @csrf

                                                <button
                                                    class="botao-acao botao-ocultar"
                                                    type="submit"
                                                >
                                                    Ocultar
                                                </button>
                                            </form>
                                        @else
                                            <form
                                                method="POST"
                                                action="{{ route('reviews.moderar', [
                                                    'id' => ($review['_id'] ?? $review['id']),
                                                    'acao' => 'mostrar'
                                                ]) }}"
                                            >
                                                @csrf

                                                <button
                                                    class="botao-acao botao-mostrar"
                                                    type="submit"
                                                >
                                                    Mostrar
                                                </button>
                                            </form>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section>
            <h2>
                Leilões ativos
                ({{ count($leiloes) }})
            </h2>

            @if (count($leiloes) === 0)
                <p class="vazio">
                    Não existem leilões ativos.
                </p>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Lote</th>
                            <th>Produtor</th>
                            <th>Produto</th>
                            <th>Valor atual</th>
                            <th>Licitações</th>
                            <th>Estado</th>
                        </tr>
                    </thead>

                    <tbody>
                        @foreach ($leiloes as $leilao)
                            <tr>
                                <td>
                                    {{ $leilao['lote'] ?? '—' }}
                                </td>

                                <td>
                                    {{
                                        $leilao['produtor']['produtor']['nomeExploracao']
                                        ?? $leilao['produtor']['nome']
                                        ?? '—'
                                    }}
                                </td>

                                <td>
                                    {{
                                        $leilao['produto']['nome']
                                        ?? '—'
                                    }}
                                </td>

                                <td>
                                    {{
                                        number_format(
                                            (float) (
                                                $leilao['licitacaoAtual']['valor']
                                                ?? $leilao['precoBase']
                                                ?? 0
                                            ),
                                            2,
                                            ',',
                                            ' '
                                        )
                                    }} €
                                </td>

                                <td>
                                    {{ $leilao['numLicitacoes'] ?? 0 }}
                                </td>

                                <td>
                                    <span class="estado">
                                        {{ ucfirst($leilao['estado'] ?? 'ativo') }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section>
            <h2>
                Últimas ações administrativas
                ({{ count($auditorias) }})
            </h2>

            @if (count($auditorias) === 0)
                <p class="vazio">
                    Ainda não existem ações registadas.
                </p>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Administrador</th>
                            <th>Ação</th>
                            <th>Tipo</th>
                            <th>Alvo</th>
                            <th>Data</th>
                        </tr>
                    </thead>

                    <tbody>
                        @foreach ($auditorias as $auditoria)
                            <tr>
                                <td>
                                    {{ $auditoria->admin_nome }}
                                </td>

                                <td>
                                    {{ str_replace('_', ' ', $auditoria->acao) }}
                                </td>

                                <td>
                                    {{ ucfirst($auditoria->tipo_alvo) }}
                                </td>

                                <td>
                                    <code>
                                        {{ $auditoria->alvo_id }}
                                    </code>
                                </td>

                                <td>
                                    {{
                                        $auditoria->created_at
                                            ->format('d/m/Y H:i')
                                    }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>
    </main>
</body>
</html>