<?php

use App\Modules\Listing\Models\Listing;
use App\Modules\Listing\Services\ListingImageService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (DB::connection()->getDatabaseName() !== 'rental_test') {
    throw new RuntimeException('Concurrency worker requires rental_test.');
}
$job = json_decode($argv[1], true, 512, JSON_THROW_ON_ERROR);
config(['filesystems.disks.public.root' => $job['directory'].'/files']);
$listing = Listing::findOrFail($job['listing_id']);
$ready = false;
DB::connection()->beforeExecuting(static function (string $sql) use ($job, &$ready): void {
    if ($ready || ! str_starts_with($sql, 'select') ||
        (! str_contains($sql, 'from "listings"') && ! str_contains($sql, 'from "listing_images"'))) {
        return;
    }
    $ready = true;
    touch($job['directory'].'/'.$job['worker'].'.ready');
    $deadline = microtime(true) + 10;
    while (! is_file($job['directory'].'/go')) {
        if (microtime(true) > $deadline) {
            throw new RuntimeException('Upload barrier timed out.');
        }
        usleep(10000);
        clearstatcache();
    }
});
DB::listen(static function (QueryExecuted $query): void {
    if (str_starts_with($query->sql, 'select count(') && str_contains($query->sql, 'from "listing_images"')) {
        // Without the listing lock, both requests can observe the same free slots.
        usleep(200000);
    }
});
$files = array_map(fn ($index) => UploadedFile::fake()->image("photo-$index.png"), range(1, $job['batch_size']));
try {
    $app->make(ListingImageService::class)->uploadImages($listing, $files);
    echo json_encode(['status' => 200], JSON_THROW_ON_ERROR);
} catch (HttpResponseException $exception) {
    echo json_encode(['status' => $exception->getResponse()->getStatusCode()], JSON_THROW_ON_ERROR);
}
