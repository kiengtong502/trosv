<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/register - create an account and log the user in (201).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $email = $data['email'] ?? '';
        assert(is_string($email));

        // forceCreate: 'role' is deliberately NOT fillable (step 10 security -
        // no endpoint may change roles through mass assignment), but the
        // registration endpoint legitimately sets it at creation time.
        $user = User::forceCreate([
            'name' => $data['name'],
            'email' => strtolower($email),
            'password' => $data['password'], // hashed via the model cast
            'role' => $data['role'],
            'avatar' => Arr::random(User::AVATARS),
            // ERD: looking_for_roommate is NOT NULL and defaults to false.
            // For landlords the UserResource always returns null instead.
            'looking_for_roommate' => false,
        ]);

        return self::tokenResponse($user, 201);
    }

    /**
     * POST /api/login - issue a Sanctum token. Wrong credentials: 422 with
     * errors.email (API_CONTRACT §4).
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->string('email')->lower()->toString();
        $password = $request->string('password')->toString();

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        return self::tokenResponse($user);
    }

    /**
     * GET /api/me - the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => new UserResource($this->authUser($request))]);
    }

    /**
     * POST /api/logout - revoke the token used for this request.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authUser($request)->currentAccessToken()->delete();

        return response()->json(['data' => null]);
    }

    /**
     * Shared { data: { token, user } } payload for register and login.
     */
    private static function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => [
                'token' => $user->createToken('web')->plainTextToken,
                'user' => new UserResource($user),
            ],
        ], $status);
    }
}
