<?php

test('a raiz redireciona para o login quando não existe sessão', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('login'));
});

test('a página de login responde com sucesso', function () {
    $response = $this->get('/login');

    $response->assertOk();
});