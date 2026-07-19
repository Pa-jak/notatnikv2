<?php

/**
 * Helpery odpowiedzi HTTP i parsowania ciała JSON.
 */

function json_out($data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $msg, int $code): never
{
    json_out(['error' => $msg], $code);
}

function json_in(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error('Niepoprawny JSON', 400);
    }
    return $data;
}