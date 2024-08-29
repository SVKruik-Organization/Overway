<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Operator>
 */
class OperatorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'snowflake' => $this->faker->uuid(),
            'username' => $this->faker->userName(),
            'email' => $this->faker->unique()->safeEmail(),
            'service_tag' => createTicket(),
            'date_creation' => $this->faker->dateTime(),
            'date_update' => $this->faker->dateTime(),
        ];
    }
}
