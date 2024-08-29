<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class AuthenticationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Log::info($request->getContent());
        return response()->json(["message" => "Default Authentication Endpoint"]);
    }

    public function login(Request $request): Response
    {
        $payload = json_decode($request->getContent(), true);
        if (empty($payload) || !isset($payload["username"]) || !isset($payload["password"])) return response()->noContent(400);

        $username = $payload["username"] ?? "";
        $password = $payload["password"] ?? "";
        return response()->json(["message" => join(" ", ["Login Authentication Endpoint", $username, $password])]);
    }

    public function register(Request $request): JsonResponse
    {
        Log::info($request->getContent());
        return response()->json(["message" => "Register Authentication Endpoint"]);
    }
}
