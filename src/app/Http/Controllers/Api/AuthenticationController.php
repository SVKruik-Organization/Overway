<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use App\Models\Operator;
use App\Models\Session;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthenticationController extends Controller
{
    /**
     * Default endpoint for authentication.
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json(["message" => "Default Authentication Endpoint"]);
    }

    /**
     * Login a user creating a new session.
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function login(Request $request): Response | JsonResponse
    {
        // Setup
        try {
            $payload = json_decode($request->getContent(), true);
            if (empty($payload) || !isset($payload["type"])) return response()->noContent(400);
            $validTypes = ["operator"];
            if (!in_array($payload["type"], $validTypes)) return response()->noContent(400);

            if ($payload["type"] === "operator") {
                // Validate
                $validator = Validator::make($payload, [
                    "username" => 'required|string',
                    "password" => 'required|string'
                ]);
                if ($validator->fails()) return response()->json($validator->errors(), 400);

                // Authenticate
                $operator = Operator::where("username", $payload["username"])->first();
                if (empty($operator)) return response()->noContent(404);
                if (!Hash::check($payload["password"], $operator->password)) return response()->noContent(401);

                // Create Session
                $jwt = issueJwt($payload["username"]);
                Session::query()->where("username", $payload["username"])->delete();
                $session = Session::factory(1)->create([
                    "type" => "jwt",
                    "user_type" => "operator",
                    "username" => $payload["username"],
                    "token" => Hash::make($jwt),
                    "date_creation" => date("Y-m-d H:i:s"),
                    "date_expiry" => date("Y-m-d H:i:s", strtotime("+2 hours")),
                ])->first();
                $session["token"] = $jwt;
                return response()->json($session);
            } else return response()->noContent(404);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->noContent(500);
        }
    }

    /**
     * Refresh a session by updating the expiry date and issuing a new token.
     * @param Request $request
     * @param int $id
     * @return Response|JsonResponse
     */
    public function refresh(Request $request, int $id): Response | JsonResponse
    {
        // Validate Existing Session
        $session = validateJwtHttp($request, $id);
        if (gettype($session) === "integer") return response()->noContent($session);

        // Validate Payload
        $payload = json_decode($request->getContent(), true);
        $validator = Validator::make($payload, [
            "type" => 'required|string',
            "username" => 'required|string'
        ]);
        if ($validator->fails()) return response()->json($validator->errors(), 400);
        if ($session->username !== $payload["username"] || $session->user_type !== $payload["type"]) return response()->noContent(401);

        // Persist New Session
        $newToken = issueJwt($payload["username"]);
        $session->date_expiry = date("Y-m-d H:i:s", strtotime("+2 hours"));
        $session->token = Hash::make($newToken);
        $session->save();

        // Return
        $session["token"] = $newToken;
        return response()->json($session);
    }

    /**
     * Register a new user of the following types: operator
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function register(Request $request): Response | JsonResponse
    {
        // Setup
        try {
            $payload = json_decode($request->getContent(), true);
            if (empty($payload) || !isset($payload["type"])) return response()->noContent(400);
            $validTypes = ["operator"];
            if (!in_array($payload["type"], $validTypes)) return response()->noContent(400);

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
                $newOperator = Operator::factory(1)->create([
                    "snowflake" => $payload["snowflake"],
                    "username" => $payload["username"],
                    "email" => $payload["email"],
                    "password" => Hash::make($payload["password"]),
                    "service_tag" => createTicket(),
                    "date_creation" => date("Y-m-d H:i:s"),
                    "date_update" => null,
                ]);
                return response()->json($newOperator);
            } else return response()->noContent(404);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->noContent(500);
        }
    }

    /**
     * Validate an exisiting JWT session.
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function validate(Request $request, int $id): Response
    {
        try {
            // Validate Session
            $session = validateJwtHttp($request, $id);
            if (gettype($session) === "integer") return response()->noContent($session);

            // Process
            return response()->noContent(200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->noContent(500);
        }
    }

    /**
     * Logout a user by deleting the session.
     * @param Request $request
     * @return Response|JsonResponse
     */
    public function logout(Request $request, int $id): Response
    {
        try {
            // Validate Session
            $session = validateJwtHttp($request, $id);
            if (gettype($session) === "integer") return response()->noContent($session);

            // Process
            $session->delete();
            return response()->noContent(200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->noContent(500);
        }
    }
}
