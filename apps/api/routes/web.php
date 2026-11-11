<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Module web routes (e.g. Messaging's signed attachment URL) live in
// app/Modules/<Module>/web.php.
foreach (glob(app_path('Modules/*/web.php')) ?: [] as $moduleRoutes) {
    require $moduleRoutes;
}
