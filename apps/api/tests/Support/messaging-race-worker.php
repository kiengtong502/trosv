<?php

use App\Modules\Auth\Models\User;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(ConsoleKernel::class)->bootstrap();
if (DB::connection()->getDatabaseName() !== 'rental_test') {
    throw new RuntimeException('Concurrency worker requires rental_test.');
}
config(['cache.default' => 'array', 'broadcasting.default' => 'null']);
$job = json_decode($argv[1], true, 512, JSON_THROW_ON_ERROR);
Auth::guard('sanctum')->setUser(User::findOrFail($job['user']));

$wait = static function () use ($job): void {
    touch($job['ready']);
    $deadline = microtime(true) + 10;
    while (! is_file($job['go'])) {
        if (microtime(true) > $deadline) {
            throw new RuntimeException('Concurrency barrier timed out.');
        }
        usleep(10000);
        clearstatcache();
    }
};
$reads = 0;
DB::connection()->beforeExecuting(static function (string $sql) use ($job, &$reads, $wait): void {
    if ($job['mode'] === 'message' && str_starts_with($sql, 'select') && str_contains($sql, 'from "messages"')) {
        // Release both requests just before the read–modify–write query.
        if (++$reads === 2) {
            $wait();
        }
    }
});
$waited = false;
DB::listen(static function (QueryExecuted $query) use ($job, &$waited, &$reads, $wait): void {
    if (! str_starts_with($query->sql, 'select')) {
        return;
    }
    if ($job['mode'] === 'conversation' && ! $waited && str_contains($query->sql, 'from "conversations"')) {
        // Both lookups must observe an absent conversation before either INSERT.
        $waited = true;
        $wait();
    }
    if ($job['mode'] === 'message' && $reads === 2 && str_contains($query->sql, 'from "messages"')) {
        // Without a row lock the other request can read the same stale snapshot.
        usleep(200000);
    }
});

$request = Request::create($job['path'], $job['method'], [], [], [], [
    'HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json',
], json_encode($job['body'], JSON_THROW_ON_ERROR));
$kernel = $app->make(Kernel::class);
$response = $kernel->handle($request);
echo json_encode(['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true)], JSON_THROW_ON_ERROR);
$kernel->terminate($request, $response);
