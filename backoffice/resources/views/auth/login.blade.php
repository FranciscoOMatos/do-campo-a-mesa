<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backoffice | Do Campo à Mesa</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            background: #f4f6f3;
            color: #1f2937;
        }

        .login {
            width: min(420px, calc(100% - 32px));
            background: white;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08);
        }

        h1 {
            margin: 0 0 8px;
        }

        .subtitulo {
            margin: 0 0 24px;
            color: #6b7280;
        }

        label {
            display: block;
            margin: 16px 0 6px;
            font-weight: 600;
        }

        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }

        button {
            width: 100%;
            margin-top: 24px;
            padding: 12px;
            border: 0;
            border-radius: 8px;
            background: #356b3f;
            color: white;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
        }

        .erro {
            margin-top: 16px;
            padding: 12px;
            border-radius: 8px;
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>

<body>
    <main class="login">
        <h1>Do Campo à Mesa</h1>
        <p class="subtitulo">Backoffice de administração</p>

        @if ($errors->any())
            <div class="erro" role="alert">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('login.submit') }}">
            @csrf

            <label for="email">Email</label>
            <input
                id="email"
                name="email"
                type="email"
                value="{{ old('email') }}"
                required
                autofocus
            >

            <label for="password">Password</label>
            <input
                id="password"
                name="password"
                type="password"
                required
            >

            <button type="submit">Entrar</button>
        </form>
    </main>
</body>
</html>