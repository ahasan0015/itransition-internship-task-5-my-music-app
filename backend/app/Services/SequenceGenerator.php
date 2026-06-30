<?php

namespace App\Services;

class SequenceGenerator
{
    private $seed;

    public function __construct(int $seed)
    {
        $this->seed = $seed;
    }

    // LCG Algorithom seed to random number
   public function next(): int
{
    $this->seed = (1103515245 * $this->seed + 12345) % 2147483648;
    return $this->seed;
}

    // Same Ranger find numbder
    public function nextInt($min, $max)
    {
        return $min + ($this->next() % ($max - $min + 1));
    }
}