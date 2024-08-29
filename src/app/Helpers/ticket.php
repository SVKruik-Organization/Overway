<?php

function createTicket(): string
{
    $characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    $ticket = "";

    for ($i = 0; $i < 8; $i++) {
        $randomIndex = rand(0, strlen($characters) - 1);
        $ticket .= $characters[$randomIndex];
    }

    return $ticket;
}
