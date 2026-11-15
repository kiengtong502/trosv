<?php

namespace Tests\Feature\Messaging;

use App\Modules\Auth\Models\User;
use App\Modules\Listing\Models\Listing;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ConcurrentMessagingTest extends TestCase
{
    // Child connections need committed fixtures, not RefreshDatabase transactions.
    use DatabaseMigrations;

    protected function tearDown(): void
    {
        // The legacy down migration restores NOT NULL on listing_id.
        Conversation::query()->delete();
        parent::tearDown();
    }

    private function race(array $jobs, string $mode): array
    {
        $this->assertSame('rental_test', DB::connection()->getDatabaseName());
        $directory = sys_get_temp_dir().'/trosv-messaging-race-'.Str::uuid();
        File::makeDirectory($directory);
        $processes = [];
        try {
            foreach ($jobs as $index => $job) {
                $job += ['mode' => $mode, 'ready' => "$directory/$index.ready", 'go' => "$directory/go"];
                $process = new Process([PHP_BINARY, base_path('tests/Support/messaging-race-worker.php'), json_encode($job, JSON_THROW_ON_ERROR)], base_path());
                $process->setTimeout(20);
                $process->start();
                $processes[] = $process;
            }
            $deadline = microtime(true) + 10;
            while (count(glob("$directory/*.ready")) !== count($jobs)) {
                foreach ($processes as $process) {
                    $this->assertTrue($process->isRunning(), $process->getOutput().$process->getErrorOutput());
                }
                $this->assertLessThan($deadline, microtime(true), 'Workers failed to reach the concurrency barrier.');
                usleep(10000);
                clearstatcache();
            }
            touch("$directory/go");
            $responses = [];
            foreach ($processes as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getOutput().$process->getErrorOutput());
                $response = json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR);
                $this->assertContains($response['status'], [200, 201]);
                $responses[] = $response;
            }

            return $responses;
        } finally {
            foreach ($processes as $process) {
                $process->stop();
            }
            File::deleteDirectory($directory);
        }
    }

    public function test_opposite_direct_requests_return_the_same_conversation(): void
    {
        $first = User::factory()->student()->create();
        $second = User::factory()->student()->create();
        $responses = $this->race([
            ['user' => $first->id, 'method' => 'POST', 'path' => "/api/users/{$second->id}/message", 'body' => []],
            ['user' => $second->id, 'method' => 'POST', 'path' => "/api/users/{$first->id}/message", 'body' => []],
        ], 'conversation');
        $this->assertSame($responses[0]['body']['data']['id'], $responses[1]['body']['data']['id']);
        $this->assertSame([200, 201], collect($responses)->pluck('status')->sort()->values()->all());
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_listing_requests_recover_inside_the_postgres_transaction(): void
    {
        $student = User::factory()->student()->create();
        $listing = Listing::factory()->create();
        $job = ['user' => $student->id, 'method' => 'POST', 'path' => '/api/conversations', 'body' => ['listing_id' => $listing->id]];
        $responses = $this->race([$job, $job], 'conversation');
        $this->assertSame($responses[0]['body']['data']['id'], $responses[1]['body']['data']['id']);
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('conversation_listing', 1);
    }

    public function test_simultaneous_reactions_preserve_both_participants(): void
    {
        $message = Message::factory()->create();
        $conversation = $message->conversation;
        $this->race([
            ['user' => $conversation->student_id, 'method' => 'PUT', 'path' => "/api/messages/{$message->id}/reactions", 'body' => ['emoji' => '👍']],
            ['user' => $conversation->landlord_id, 'method' => 'PUT', 'path' => "/api/messages/{$message->id}/reactions", 'body' => ['emoji' => '❤️']],
        ], 'message');
        $reactions = $message->refresh()->reactions;
        $this->assertCount(2, $reactions);
        $this->assertSame('👍', $reactions[$conversation->student_id]);
        $this->assertSame('❤️', $reactions[$conversation->landlord_id]);
    }

    public function test_removing_one_reaction_does_not_erase_the_other_users_change(): void
    {
        $message = Message::factory()->create();
        $conversation = $message->conversation;
        $message->update(['reactions' => [$conversation->student_id => '👍', $conversation->landlord_id => '😢']]);
        $this->race([
            ['user' => $conversation->student_id, 'method' => 'DELETE', 'path' => "/api/messages/{$message->id}/reactions", 'body' => []],
            ['user' => $conversation->landlord_id, 'method' => 'PUT', 'path' => "/api/messages/{$message->id}/reactions", 'body' => ['emoji' => '😂']],
        ], 'message');
        $this->assertSame([$conversation->landlord_id => '😂'], $message->refresh()->reactions);
    }

    public function test_simultaneous_self_deletions_preserve_both_user_ids(): void
    {
        $message = Message::factory()->create();
        $conversation = $message->conversation;
        $this->race([
            ['user' => $conversation->student_id, 'method' => 'DELETE', 'path' => "/api/messages/{$message->id}?scope=self", 'body' => []],
            ['user' => $conversation->landlord_id, 'method' => 'DELETE', 'path' => "/api/messages/{$message->id}?scope=self", 'body' => []],
        ], 'message');
        $this->assertEqualsCanonicalizing([$conversation->student_id, $conversation->landlord_id], $message->refresh()->deleted_for_user_ids);
    }
}
