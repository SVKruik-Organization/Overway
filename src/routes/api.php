<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthenticationController;

// Authentication Routes
Route::prefix("auth")->group(function () {
    Route::get("/", [AuthenticationController::class, "index"]);
    Route::post("/login", [AuthenticationController::class, "login"]);
    Route::post("/register", [AuthenticationController::class, "register"]);
});
