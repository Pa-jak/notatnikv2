<?php

/**
 * Autoryzacja: token aplikacji jako HMAC-SHA256 nad stałą etykietą,
 * weryfikowany przez nagłówek Authorization: Bearer <token>.
 */

function app_secret(): string
{
    /** @var array $cfg */
    $cfg = require __DIR__ . '/../config.php';
    return (string) ($cfg['app_secret'] ?? '');
}

function appToken(): string
{
    return hash_hmac('sha256', 'notatnik-v1', app_secret());
}

function getAuthorizationHeader(): string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        foreach ($h as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) {
                return $v;
            }
        }
    }
    return '';
}

function requireAuth(): void
{
    $h = getAuthorizationHeader();
    if ($h === '') {
        json_error('Brak nagłówka Authorization', 401);
    }
    if (!preg_match('/^Bearer\s+(.+)$/i', $h, $m)) {
        json_error('Niepoprawny nagłówek Authorization', 401);
    }
    $token = trim($m[1]);
    if (!hash_equals(appToken(), $token)) {
        json_error('Niepoprawny token', 401);
    }
}