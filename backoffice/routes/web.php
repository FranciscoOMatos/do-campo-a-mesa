<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminManagementController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return session()->has('admin_token')
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::get(
    '/login',
    [AdminAuthController::class, 'showLogin']
)->name('login');

Route::post(
    '/login',
    [AdminAuthController::class, 'login']
)->name('login.submit');

Route::get(
    '/dashboard',
    [DashboardController::class, 'index']
)->name('dashboard');

Route::post(
    '/produtores/{id}/{decisao}',
    [AdminManagementController::class, 'validarProdutor']
)->name('produtores.validar');

Route::post(
    '/reviews/{id}/{acao}',
    [AdminManagementController::class, 'moderarReview']
)->name('reviews.moderar');

Route::post(
    '/logout',
    [AdminAuthController::class, 'logout']
)->name('logout');