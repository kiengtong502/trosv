<?php

namespace Tests\Feature\Listing;

use App\Modules\Listing\Models\Listing;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ConcurrentImageUploadTest extends TestCase
{
    // Independent processes need committed fixtures, not RefreshDatabase transactions.
    use DatabaseMigrations;

    public static function uploadCases(): array
    {
        return ['single photo' => [4, 1], 'two-photo batch' => [3, 2]];
    }

    #[DataProvider('uploadCases')]
    public function test_concurrent_uploads_never_exceed_five_images(int $existingCount, int $batchSize): void
    {
        $this->assertSame('rental_test', DB::connection()->getDatabaseName());
        $listing = Listing::factory()->create();
        $directory = sys_get_temp_dir().'/trosv-image-race-'.Str::uuid();
        File::makeDirectory($directory.'/files/listings', 0755, true);
        $processes = [];
        try {
            for ($index = 0; $index < $existingCount; $index++) {
                $path = "listings/existing-$index.png";
                $listing->images()->create(['path' => $path]);
                File::put($directory.'/files/'.$path, 'existing image');
            }
            foreach ([0, 1] as $worker) {
                $job = ['listing_id' => $listing->id, 'directory' => $directory, 'worker' => $worker, 'batch_size' => $batchSize];
                $process = new Process([PHP_BINARY, base_path('tests/Support/image-upload-race-worker.php'), json_encode($job, JSON_THROW_ON_ERROR)], base_path());
                $process->setTimeout(20);
                $process->start();
                $processes[] = $process;
            }
            $deadline = microtime(true) + 10;
            while (count(glob($directory.'/*.ready')) !== 2) {
                foreach ($processes as $process) {
                    if (! $process->isRunning()) {
                        $this->fail($process->getOutput().$process->getErrorOutput());
                    }
                }
                if (microtime(true) > $deadline) {
                    $this->fail('Workers failed to reach the upload barrier.');
                }
                usleep(10000);
                clearstatcache();
            }
            touch($directory.'/go');
            $statuses = [];
            foreach ($processes as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getOutput().$process->getErrorOutput());
                $statuses[] = json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR)['status'];
            }
            sort($statuses);
            $this->assertSame([200, 422], $statuses);
            $this->assertSame(5, $listing->images()->count());
            $this->assertCount(5, File::allFiles($directory.'/files'));
            for ($index = 0; $index < $existingCount; $index++) {
                $this->assertFileExists($directory."/files/listings/existing-$index.png");
            }
        } finally {
            foreach ($processes as $process) {
                $process->stop();
            }
            File::deleteDirectory($directory);
        }
    }
}
