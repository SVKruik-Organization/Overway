<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use Illuminate\Support\Facades\Log;

class UplinkConsumer extends Command
{
    protected $signature = 'uplink:consume';
    protected $description = 'Consume messages from the Uplink server.';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        try {
            $channel = (new AMQPStreamConnection(
                env('AMQP_HOST'),
                env('AMQP_PORT', 5672),
                env('AMQP_USERNAME'),
                env('AMQP_PASSWORD')
            ))->channel();

            $channel->exchange_declare('overway', 'direct', false, false, false);
            list($queue_name,,) = $channel->queue_declare('', false, false, true);
            $channel->queue_bind($queue_name, "overway", 'server');
            $callback = function ($msg) {
                $rawPayload = $msg->body;
                $payload = json_decode($rawPayload, true);
                Log::info('New Uplink message from || ' . $payload['sender'] . ' ||');
                $msg->ack();
            };

            $channel->basic_consume($queue_name, '', false, false, false, false, $callback);
            Log::info("Uplink listening on 'overway'@'server'");

            while ($channel->is_consuming()) {
                $channel->wait();
            }
        } catch (\Throwable $e) {
            Log::error('Uplink connection error: ' . $e->getMessage());
        }
    }
}
