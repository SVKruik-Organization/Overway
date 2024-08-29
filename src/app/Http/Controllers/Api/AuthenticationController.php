<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use App\Models\Operator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthenticationController extends Controller
{
    /**
     * Default endpoint for authentication.
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        Log::info($request->getContent());
        return response()->json(["message" => "Default Authentication Endpoint"]);
    }

    /**
     * Login a user creating a new session.
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function login(Request $request): Response | JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (empty($payload) || !isset($payload["username"]) || !isset($payload["password"])) return response()->noContent(400);
        $username = $payload["username"] ?? "";
        $password = $payload["password"] ?? "";
        Log::info(Operator::all());
        return response()->json(["message" => join(" ", ["Login Authentication Endpoint", $username, $password])]);
    }

    /**
     * Register a new user of the following types: operator
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function register(Request $request): Response | JsonResponse
    {
        // Setup
        $payload = json_decode($request->getContent(), true);
        if (empty($payload) || !isset($payload["type"])) return response()->noContent(400);
        $validTypes = ["operator"];
        if (!in_array($payload["type"], $validTypes)) return response()->noContent(400);
        $newEntity = null;

        if ($payload["type"] === "operator") {
            // Validate
            $validator = Validator::make($payload, [
                "snowflake" => 'required|string|unique:operator|min:18|max:18',
                "username" => 'required|string|unique:operator',
                "password" => 'required|string',
                'email' => 'required|email|unique:operator',
            ]);
            if ($validator->fails()) return response()->json($validator->errors(), 400);

            // Create
            $newEntity = Operator::factory(1)->create([
                "snowflake" => $payload["snowflake"],
                "username" => $payload["username"],
                "email" => $payload["email"],
                "password" => Hash::make($payload["password"]),
                "service_tag" => createTicket(),
                "date_creation" => date("Y-m-d H:i:s"),
                "date_update" => null,
            ]);
        }

        // Return On Success
        return response()->json($newEntity);
    }
}
