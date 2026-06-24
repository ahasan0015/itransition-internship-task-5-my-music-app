<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\SequenceGenerator;

class SongController extends Controller
{
    /**
     * Song list accroding to seed data
     * route: GET /api/songs?seed=12345
     */
    public function index(Request $request)
    {
        // seed recive fron user if not seed default 12345
        $seed = (int) $request->query('seed', 12345);
        
        // sequenceGenarator initalize
        $generator = new SequenceGenerator($seed);

        // ৩. Data set 
        $titles = ['Onday I gonna fly away', 'Midnight Sky', 'Neon Dreams', 'Sunset Vibes', 'Broken Strings', 'coder dreams Night', 'Urban Pulse', 'Lost in Time'];
        $artists = ['CR 7', 'Neymar', 'Messo', 'ronaldo', 'Coda', 'Echo State', 'Pulse', 'Aether'];
        $genres = ['Rock', 'Jazz', 'Pop', 'Classical', 'Hip Hop', 'Electronic', 'Blues'];

        $songs = [];

        // sequence loop same data return always
        for ($i = 0; $i < 20; $i++) {
            $songs[] = [
                'id' => $i + 1,
                'title' => $titles[$generator->nextInt(0, count($titles) - 1)],
                'artist' => $artists[$generator->nextInt(0, count($artists) - 1)],
                'genre' => $genres[$generator->nextInt(0, count($genres) - 1)],
                'likes' => $generator->nextInt(0, 5000), // demarite likes    
                'duration' => $generator->nextInt(180, 360) . 's' // duration
            ];
        }

        // ৫. JSON Formate response
        return response()->json([
            'seed' => $seed,
            'data' => $songs
        ]);
    }
}