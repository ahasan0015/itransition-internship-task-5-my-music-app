<?php

use App\Http\Controllers\Api\SongController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/songs', [SongController::class, 'index']);
Route::get('/languages', [SongController::class, 'getLanguages']);