<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\SequenceGenerator;
use Faker\Factory as Faker;

class SongController extends Controller
{
    public function index(Request $request)
    {
        $seed = (int) $request->query('seed', 12345);
        $lang = $request->query('lang', 'en');
        $page = (int) $request->query('page', 1);
        $avgLikes = (float) $request->query('avgLikes', 0);

        // use config for data load
        $musicData = config('music_locales');
        $config = $musicData[$lang] ?? $musicData['en'];

        $songs = [];
        $faker = Faker::create(); // Faker initialization

        for ($i = 0; $i < 20; $i++) {
            //core data generation (seed, page, index)
            $coreSeed = $seed + $page + $i;
            $faker->seed($coreSeed);
            
            $title = $faker->randomElement($config['titles']);
            $artist = $faker->randomElement($config['artists']);
            $genre = $faker->randomElement($config['genres']);
            $album = $faker->randomElement($config['albums']);
            // core genarator(for time and unique data)
            $coreGenerator = new SequenceGenerator($coreSeed);
            $duration = $coreGenerator->nextInt(180, 360) . 's';

            //differente likes generation(differente seed & 9999 for not to affect core data)
            $likesGenerator = new SequenceGenerator($coreSeed + 9999);
            $likes = $this->calculateLikes($avgLikes, $likesGenerator);

            $songs[] = [
                'id' => (($page - 1) * 20) + $i + 1,
                'title' => $title,
                'artist' => $artist,
                'album' => $album,
                'genre' => $genre,
                'likes' => $likes,
                'duration' => $duration
            ];
        }

        return response()->json([
            'seed' => $seed, 
            'page' => $page,
            'data' => $songs
        ]);
    }

    private function calculateLikes(float $avg, SequenceGenerator $generator): int
    {
        $baseLikes = floor($avg);
        $fraction = $avg - $baseLikes;
        if (($generator->nextInt(0, 9999) / 10000) < $fraction) {
            return (int)$baseLikes + 1;
        }
        return (int)$baseLikes;
    }
}