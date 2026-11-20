<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Only the frontend origin (FRONTEND_URL) may call the API. Bearer token
    | auth only needs the Authorization header; no cookies, so credentials
    | stay disabled.
    |
    */

    'paths' => ['api/*', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_merge(
        [env('FRONTEND_URL', 'http://localhost:3001')],
        // Extra origins (comma-separated): e.g. the dockerized frontend on
        // :3000 when the API runs in Docker, or a local Vite on :3001 when
        // the API runs in Docker. Empty entries are dropped.
        explode(',', (string) env('FRONTEND_EXTRA_URLS', '')),
        // Local production-bundle smoke tests (vite preview).
        [env('FRONTEND_PREVIEW_URL', 'http://localhost:3002')]
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Content-Type',
        'Authorization',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
