<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Session>
 */
class SessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => 'jwt',
            'user_type' => 'operator',
            'username' => $this->faker->userName(),
            'token' => $this->faker->uuid(),
            'date_creation' => $this->faker->dateTime(),
            'date_expiry' => $this->faker->dateTime()->modify('+2 hour'),
        ];
    }
}
