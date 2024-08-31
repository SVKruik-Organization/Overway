<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;

class UplinkProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     */
    public function register(): void
    {
        $this->startUplinkConsumer();
    }

    /**
     * Start the Uplink consumer as an asynchronous process.
     */
    protected function startUplinkConsumer(): void
    {
        Log::info('Starting Uplink Consumer...');
        $process = new Process(['php', 'artisan', 'uplink:consume']);
        $process->start();
        $process->getOutput();
        $process->getErrorOutput();
    }
}
