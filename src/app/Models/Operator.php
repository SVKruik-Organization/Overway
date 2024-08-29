<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Operator extends Model
{
    use HasFactory;
    protected $table = 'operator';
    protected $primaryKey = 'id';
    public $incrementing = true;
    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_update';

    protected $fillable = [
        'snowflake',
        'username',
        'email',
        'service_tag',
        'date_creation',
        'date_update',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'date_creation' => 'datetime',
        'date_update' => 'datetime',
    ];
}
