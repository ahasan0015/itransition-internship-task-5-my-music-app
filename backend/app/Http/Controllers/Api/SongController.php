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

        for ($i = 0; $i < 10; $i++) {
            //core data generation (seed, page, index)
            // $coreSeed = $seed + $page + $i;
            $coreSeed = (($seed * 31) ^ ($page * 37) ^ ($i * 41));
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

            //review generation
            $reviewGenerator = new SequenceGenerator($coreSeed + 8888);
            $review = $this->generateRandomReview($reviewGenerator, $lang);

            $songs[] = [
                'id' => (($page - 1) * 10) + $i + 1,
                'title' => $title,
                'artist' => $artist,
                'album' => $album,
                'genre' => $genre,
                'likes' => $likes,
                'duration' => $duration,
                // $duration 
                'review' => $review,
                'music_theory' => $this->getMusicTheory($seed, $page, $i, $duration) 
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

public function getMusicTheory(int $seed, int $page, int $index, string $duration) 
{
    $coreSeed = (($seed * 31) ^ ($page * 37) ^ ($index * 41));
    $gen = new SequenceGenerator($coreSeed);

    // scale laibary for 
    $scaleLibrary = [
        'E Major' => ['E4', 'G#4', 'B4', 'C#5', 'E5', 'B5'], // happy mode
        'A Minor' => ['A4', 'C5', 'E5', 'G5', 'A5', 'C6'],   // sad mode
        'G Major' => ['G4', 'B4', 'D5', 'G5', 'A5', 'B5'],   // pop/energetic
        'Blues'   => ['E4', 'G4', 'A4', 'Bb4', 'B4', 'D5']   // jazz/blues
    ];

    // seed to randomly select scale
    $scaleKeys = array_keys($scaleLibrary);
    $selectedScaleName = $scaleKeys[$gen->nextInt(0, count($scaleKeys) - 1)];
    $notes = $scaleLibrary[$selectedScaleName];

    // selacted scale to cord
    $chords = [
        'I'  => [$notes[0], $notes[2], $notes[4]], // Root chord
        'IV' => [$notes[1], $notes[3], $notes[5]], // Subdominant
        'V'  => [$notes[2], $notes[4], $notes[0]], // Dominant
        'vi' => [$notes[5], $notes[1], $notes[3]], // Minor chord
    ];

    // dynamic chord progression selection (3 options)
    $progressions = [
        ['I', 'IV', 'V', 'I'],
        ['I', 'V', 'IV', 'V'],
        ['vi', 'IV', 'I', 'V']
    ];
    $selectedProgression = $progressions[$gen->nextInt(0, count($progressions) - 1)];

    // dynamic tempo generation (80-150 BPM)
    // scale controll
    $tempo = $gen->nextInt(80, 150);

    return [
        'tempo' => $tempo,
        'scale' => $selectedScaleName,
        'progression' => $selectedProgression,
        'notes' => $this->generatePowerfulMelody($gen, $duration, $chords, $selectedProgression)
    ];
}

private function generatePowerfulMelody($gen, $totalDuration, $chords, $progression)
{
    $notes = [];
    $durationInSeconds = (int)str_replace('s', '', $totalDuration);
    $currentTime = 0;
    
    // rhythms for different speeds (slow, normal, fast)
    $rhythms = [
        ['duration' => '4n', 'time_add' => 0.5], // slow
        ['duration' => '8n', 'time_add' => 0.25], // normal
        ['duration' => '16n', 'time_add' => 0.125] // fast
    ];

    foreach ($progression as $chordKey) {
        $chordNotes = $chords[$chordKey];
        
        // each cord has a specific time allocation (10 seconds divided by the number of chords)
        $chordDuration = $durationInSeconds / count($progression);
        $chordTimeEnd = $currentTime + $chordDuration;

        while ($currentTime < $chordTimeEnd - 0.2) {
            // random sailant
            if ($gen->nextInt(0, 10) > 2) { 
                
                // rhythm chosen based on random selection (80% normal, 20% slow)
                $rhythmIndex = $gen->nextInt(0, 10) > 8 ? 0 : 1; 
                $rhythm = $rhythms[$rhythmIndex];
                
                //velocity (accent): the first note of the chord has more power
                $velocity = ($currentTime % $chordDuration < 0.1) ? 0.95 : $gen->nextInt(70, 85) / 100;

                // melodic note selection from the chord notes
                
                $note = $chordNotes[$gen->nextInt(0, count($chordNotes) - 1)];

                $notes[] = [
                    'note' => $note,
                    'duration' => $rhythm['duration'],
                    'time' => round($currentTime, 3),
                    'velocity' => $velocity
                ];
            }
            
            // time increment based on rhythm (quarter note interval)
            $currentTime += 0.25; // per quarter note interval
        }
    }
    return $notes;
}

private function generateUniqueNotes($gen, $totalDuration, $scale, $rhythm)
{
    $notes = [];
    $durationInSeconds = (int)str_replace('s', '', $totalDuration);
    $noteCount = $durationInSeconds * 2; 

    for ($i = 0; $i < $noteCount; $i++) {
        // rhythm-based duration calculation
        $dur = ($rhythm === 'steady' && $i % 2 === 0) ? '4n' : '8n';
        if ($rhythm === 'sparse' && $i % 3 !== 0) continue; // create gaps occasionally

        $notes[] = [
            'note' => $scale[$gen->nextInt(0, count($scale) - 1)],
            'duration' => $dur,
            'time' => $i * 0.5 
        ];
    }
    return $notes;
}
private function generateRandomReview(SequenceGenerator $gen, string $lang): string
    {
        $reviews = [
            'en' => ["A masterpiece!", "Incredible sound.", "Catchy hooks.", "Not my favorite.", "Very innovative."],
            'bn' => ["দুর্দান্ত সৃষ্টি!", "অবিশ্বাস্য সুর।", "খুবই আকর্ষণীয়।", "ততটা ভালো লাগেনি।", "নতুনত্বের ছোঁয়া।"],
            'ger' => ["Ein Meisterwerk!", "Unglaublicher Sound.", "Eingängig.", "Nicht mein Favorit.", "Sehr innovativ."]
        ];

        $data = $reviews[$lang] ?? $reviews['en'];
        return $data[$gen->nextInt(0, count($data) - 1)];
    }
}