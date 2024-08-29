<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userAgent = $request->header('User-Agent');
        $method = $request->getMethod();
        $url = $request->fullUrl();
        $body = $request->getContent();
        $bodySnippet = $body ? substr($body, 0, 100) : 'None';

        Log::info("API Request || Agent: {$userAgent} || {$method} {$url} || Body: (100 char limit) {$bodySnippet}");

        return $next($request);
    }
}
