<?php

namespace Tests\Feature\Messaging;

use App\Modules\Auth\Models\User;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use RuntimeException;
use Tests\TestCase;

/**
 * The socket is best-effort: when Reverb is down (restarting, unreachable) chat
 * must keep working. The other messaging tests fake events, which hides the real
 * dispatch path - here the broadcaster itself throws, like an unreachable Reverb.
 */
class BroadcastResilienceTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    private User $landlord;

    private Conversation $conversation;

    protected function setUp(): void
    {
        parent::setUp();

        Broadcast::extend('exploding', fn () => new class extends Broadcaster
        {
            public function auth($request): mixed
            {
                return true;
            }

            public function validAuthenticationResponse($request, $result): mixed
            {
                return true;
            }

            public function broadcast(array $channels, $event, array $payload = []): void
            {
                throw new RuntimeException('Pusher error: Could not resolve host: reverb');
            }
        });
        config([
            'broadcasting.default' => 'exploding',
            'broadcasting.connections.exploding' => ['driver' => 'exploding'],
        ]);

        $this->student = User::factory()->student()->create();
        $this->landlord = User::factory()->landlord()->create();
        $this->conversation = Conversation::factory()->create([
            'student_id' => $this->student->id,
            'landlord_id' => $this->landlord->id,
        ]);
    }

    private function messageFrom(User $sender): Message
    {
        return Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $sender->id,
        ]);
    }

    public function test_sending_a_message_survives_a_dead_socket(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/conversations/{$this->conversation->id}/messages", ['body' => 'xin chào'])
            ->assertCreated();

        $this->assertDatabaseHas('messages', ['conversation_id' => $this->conversation->id, 'body' => 'xin chào']);
    }

    public function test_marking_read_survives_a_dead_socket(): void
    {
        $message = $this->messageFrom($this->student);

        $this->actingAs($this->landlord, 'sanctum')
            ->postJson("/api/conversations/{$this->conversation->id}/read")
            ->assertOk();

        $this->assertNotNull($message->refresh()->seen_at);
    }

    public function test_reacting_survives_a_dead_socket(): void
    {
        $message = $this->messageFrom($this->student);

        $this->actingAs($this->landlord, 'sanctum')
            ->putJson("/api/messages/{$message->id}/reactions", ['emoji' => '👍'])
            ->assertOk();

        $this->assertSame('👍', $message->refresh()->reactions[(string) $this->landlord->id] ?? null);
    }

    public function test_removing_a_reaction_survives_a_dead_socket(): void
    {
        $message = $this->messageFrom($this->student);
        $message->update(['reactions' => [(string) $this->landlord->id => '👍']]);

        $this->actingAs($this->landlord, 'sanctum')
            ->deleteJson("/api/messages/{$message->id}/reactions")
            ->assertOk();
    }

    public function test_unsending_survives_a_dead_socket(): void
    {
        $message = $this->messageFrom($this->student);

        $this->actingAs($this->student, 'sanctum')
            ->deleteJson("/api/messages/{$message->id}?scope=unsent")
            ->assertOk();

        $this->assertTrue($message->refresh()->isUnsent());
    }

    public function test_deleting_for_myself_survives_a_dead_socket(): void
    {
        $message = $this->messageFrom($this->student);

        $this->actingAs($this->landlord, 'sanctum')
            ->deleteJson("/api/messages/{$message->id}?scope=self")
            ->assertOk();
    }
}
