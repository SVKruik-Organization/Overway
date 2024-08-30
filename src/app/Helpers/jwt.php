<?php

use Illuminate\Support\Facades\Hash;
use Lcobucci\JWT\Encoding\ChainedFormatter;
use Lcobucci\JWT\Encoding\JoseEncoder;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Token\Builder;
use Illuminate\Http\Request;
use App\Models\Session;

require __DIR__ . '/../../vendor/autoload.php';

/**
 * Create a new JWT.
 * @param string $username
 * @return string
 */
function issueJwt(string $username): string
{
    $tokenBuilder = (new Builder(new JoseEncoder(), ChainedFormatter::default()));
    $algorithm    = new Sha256();
    $signingKey   = InMemory::plainText(env('JWT_SECRET'));

    $now   = new DateTimeImmutable();
    $token = $tokenBuilder
        ->issuedBy($_SERVER['HTTP_HOST'])
        ->permittedFor($_SERVER['HTTP_HOST'])
        ->identifiedBy(createTicket())
        ->issuedAt($now)
        ->expiresAt($now->modify('+2 hour'))
        ->withClaim('username', $username)
        ->withClaim('user_type', 'operator')
        ->withHeader('factory', 'Overway')
        ->getToken($algorithm, $signingKey);

    return $token->toString();
}

/**
 * Check if the JWT is valid.
 * This function does not check if the token is expired.
 * @param string $token
 * @return int|Session
 */
function validateJwtHttp(Request $request, int $id): int | Session
{
    $jwt = $request->bearerToken();
    if (empty($jwt) || empty($request)) return 400;
    $session = Session::query()->where("id", $id)->first();

    if (empty($session)) {
        return 404;
    } else if (strtotime($session->date_expiry) < strtotime(date("Y-m-d H:i:s")) || !Hash::check($jwt, $session["token"])) {
        $session->delete();
        return 401;
    }

    return $session;
}
