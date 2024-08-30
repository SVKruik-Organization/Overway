<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;
    protected $table = 'session';
    protected $primaryKey = 'id';
    public $incrementing = true;
    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'type',
        'user_type',
        'username',
        'token',
        'date_creation',
        'date_expiry',
    ];

    protected $hidden = [];

    protected $casts = [
        'date_creation' => 'datetime',
        'date_expiry' => 'datetime',
    ];
}
