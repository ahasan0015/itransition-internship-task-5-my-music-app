import React, { useEffect, useState } from "react";
import api from "../Config";
import * as Tone from "tone";
import "../styles/music_slider.css";
import "../styles/volum_button.css";

import AlbumCover from "../components/AlbumCover";
import SongSkeleton from "../components/SongSkeleton";

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  likes: number;
  duration: string;
  album: string;
  review: string;
  music_theory: {
    tempo: number;
    scale: string;
    progression: string[];
    notes: {
      note: string;
      duration: string;
      time: number;
      velocity?: number;
    }[];
  };
}

interface Language {
  code: string;
  name: string;
}

export default function SongTable() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [volume, setVolume] = useState(-10);

  //UX improvements with isloading
  const [isLoading, setIsLoading] = useState(false);

  const reverbRef = React.useRef<Tone.Reverb | null>(null);
  const synthRef = React.useRef<Tone.AMSynth | null>(null);
  const volumeNodeRef = React.useRef<Tone.Volume | null>(null);

  //language state for dynamic language selection
  const [languages, setLanguages] = useState<Language[]>([]);

  //dynamic language
  const [params, setParams] = useState({
    lang: "en",
    seed: 58933423,
    avgLikes: 3.7,
  });

  //language fetch useEffect
  useEffect(() => {
    api
      .get("/languages")
      .then((res) => setLanguages(res.data))
      .catch((err) => console.error("Languages load failed:", err));
  }, []);

  // Use effect for songTable API call
  useEffect(() => {
    const controller = new AbortController(); // for fetch cancellation
    const signal = controller.signal;

    queueMicrotask(() => {
      setIsLoading(true);
    });

    const requestParams = { ...params, page };

    api
      .get("/songs", { params: requestParams, signal })
      .then((res) => {
        if (viewMode === "grid" && page > 1) {
          setSongs((prev) => [...prev, ...res.data.data]);
        } else {
          setSongs(res.data.data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") {
          console.error("Error:", err);
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort(); //if componet remove new call cancel first call
    };
  }, [params, page, viewMode]);

  // Infinite scroll for grid view
  useEffect(() => {
    const handleScroll = () => {
      // if isLoading true new call preventing
      if (isLoading) return;

      if (viewMode === "grid") {
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200
        ) {
          setPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode, isLoading]);

  //view mode select function for table and grid view
  const switchView = (mode: "table" | "grid") => {
    // if the same mode is selected, prevent unnecessary re-rendering
    if (viewMode === mode) return;

    pauseSong();

    setViewMode(mode);
    setPage(1);
  };

  //for pausing the song when user clicks on another song or pause button
  function pauseSong() {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    setIsPlaying(false);
    setPlayingId(null);
    setCurrentTime(0);
  }

  //Playback Logic Effect
  useEffect(() => {
    if (isPlaying && playingId !== null) {
      const song = songs.find((s) => s.id === playingId);
      if (!song) return;

      // Audio Graph
      const vol = new Tone.Volume(volume).toDestination();
      volumeNodeRef.current = vol;

      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).connect(vol);
      reverbRef.current = reverb;

      const synth = new Tone.AMSynth({
        harmonicity: 3,
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.5 },
      }).connect(reverb);
      synthRef.current = synth;

      // Calculate End Time
      const lastNote = song.music_theory.notes.reduce((max, note) =>
        note.time > max.time ? note : max,
      );
      const endTime =
        lastNote.time + Tone.Time(lastNote.duration).toSeconds() + 1;

      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
      transport.bpm.value = song.music_theory.tempo;

      // Schedule Stop
      transport.scheduleOnce(() => {
        transport.stop();
        transport.cancel();
        setIsPlaying(false);
        setPlayingId(null);
        setCurrentTime(0);
      }, endTime);

      const part = new Tone.Part((time, value) => {
        synth.triggerAttackRelease(
          value.note,
          value.duration,
          time,
          value.velocity || 1,
        );
      }, song.music_theory.notes);

      part.start(0);
      transport.start();

      return () => {
        transport.stop();
        transport.cancel();
        synth.dispose();
        reverb.dispose();
        vol.dispose();
      };
    }
  }, [isPlaying, playingId, songs, volume]);

  //for playing a song
  async function playSong(song: Song) {
    // browser audio context initialization
    await Tone.start();

    if (playingId === song.id) {
      pauseSong();
    } else {
      pauseSong();
      setPlayingId(song.id);
      setIsPlaying(true);
    }
  }

  //useEffect for updating the current time of the song and checking if it has ended

  useEffect(() => {
    let animationFrameId: number;

    const updateTime = () => {
      if (isPlaying && playingId !== null) {
        const currentTime = Tone.getTransport().seconds;

        setCurrentTime((prevTime) => {
          // if the value is the same, no need to re-render
          if (Math.floor(prevTime) === Math.floor(currentTime)) {
            return prevTime;
          }
          return currentTime;
        });

        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, playingId, songs]);

  // second MM:SS format function

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // for volume change useEffect
  useEffect(() => {
    if (volumeNodeRef.current) {
      volumeNodeRef.current.volume.value = volume;
    }
  }, [volume]); // here only for volume

  return (
    <div className="container mt-4">
      {/* Toolbar */}
      <div className="row mb-4 align-items-center bg-light p-3 border rounded shadow-sm">
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Language</label>
         <select
  className="form-select"
  value={params.lang}
  onChange={(e) => {
    setSongs([]); 
    setIsLoading(true); 
    setPage(1); 
    setParams({ ...params, lang: e.target.value });
  }}
>
  {/* এখানে ম্যাপ করুন */}
  {languages.map((lang) => (
    <option key={lang.code} value={lang.code}>
      {lang.name}
    </option>
  ))}
</select>
        </div>

        <div className="col-md-3">
          <label className="small text-muted fw-bold">Seed</label>
          <div className="input-group">
            <input
              type="number"
              className="form-control"
              value={params.seed}
              onChange={(e) => {
                setPage(1);
                setParams({ ...params, seed: parseInt(e.target.value) || 0 });
              }}
            />
            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setParams({
                  ...params,
                  seed: Math.floor(Math.random() * 100000000),
                })
              }
            >
              <i className="bi bi-shuffle"></i>
            </button>
          </div>
        </div>

        {/* Likes slider */}

        <div className="col-md-4">
          <label className="small text-muted fw-bold">
            Likes: {params.avgLikes}
          </label>
          <input
            type="range"
            className="form-range"
            min="0"
            max="10"
            step="0.1"
            value={params.avgLikes}
            onChange={(e) =>
              setParams({ ...params, avgLikes: parseFloat(e.target.value) })
            }
          />
        </div>

        {/* view mode buttons */}
        <div className="col-md-2 text-end">
          <div className="btn-group">
            <button
              className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => switchView("grid")}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            <button
              className={`btn ${viewMode === "table" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => switchView("table")}
            >
              <i className="bi bi-layout-text-window-reverse"></i>
            </button>
          </div>
        </div>
      </div>

      {isLoading && songs.length === 0 ? (
        // loading indicator for initial load
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3 fw-bold">Generating songs...</span>
        </div>
      ) : (
        <>
          {/* Table */}
          {viewMode === "table" ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "5%" }}>#</th>
                    <th>Song</th>
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Genre</th>
                  </tr>
                </thead>

                <tbody>
                  {songs.map((song) => (
                    <React.Fragment key={song.id}>
                      <tr
                        onClick={() => {
                          // if click on a different row, stop the current song
                          if (expandedId !== song.id) {
                            pauseSong();
                          }
                          setExpandedId(
                            expandedId === song.id ? null : song.id,
                          );
                        }}
                        style={{ cursor: "pointer" }}
                        className={expandedId === song.id ? "table-active" : ""}
                      >
                        <td>
                          <i
                            className={`bi bi-chevron-${expandedId === song.id ? "up" : "down"} me-2`}
                          ></i>
                          {song.id}
                        </td>
                        <td className="fw-semibold">{song.title}</td>
                        <td>{song.artist}</td>
                        <td>{song.album}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {song.genre}
                          </span>
                        </td>
                      </tr>

                      {/* Sample Expanded Row */}
                      {expandedId === song.id && (
                        <tr className="bg-white">
                          <td colSpan={5} className="p-4 border-bottom">
                            <div className="d-flex align-items-center gap-4">
                              <div
                                className="bg-dark rounded"
                                style={{ width: "120px", height: "120px" }}
                              >
                                {/* album cover from utils/CoverGenerator.ts */}
                                <AlbumCover
                                  title={song.title} // each song data
                                  artist={song.artist}
                                />
                              </div>

                              {/* play button volume and time bar in one line */}
                              <div className="mt-3">
                                <div className="d-flex align-items-center gap-3">
                                  <i
                                    className={`bi ${isPlaying && playingId === song.id ? "bi-pause-circle-fill" : "bi-play-circle-fill"} text-primary`}
                                    onClick={() => playSong(song)}
                                    style={{
                                      fontSize: "2rem",
                                      cursor: "pointer",
                                      transition: "transform 0.2s ease", //for smooth hover
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.transform =
                                        "scale(1.1)")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.transform =
                                        "scale(1)")
                                    }
                                  ></i>

                                  {/* volume slider */}
                                  <div className="d-flex align-items-center gap-2">
                                    <i
                                      className={`bi ${volume > -30 ? "bi-volume-up-fill" : "bi-volume-mute-fill"} text-secondary`}
                                    ></i>
                                    <input
                                      type="range"
                                      className="custom-audio-slider" // 'form-range change'
                                      style={
                                        {
                                          width: "80px",
                                          "--progress": `${((volume + 40) / 40) * 100}%`, // volume with percentage calculation for slider
                                        } as React.CSSProperties
                                      }
                                      min="-40"
                                      max="0"
                                      step="1"
                                      value={volume}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setVolume(val);
                                        if (volumeNodeRef.current) {
                                          volumeNodeRef.current.volume.value =
                                            val;
                                        }
                                      }}
                                    />
                                  </div>

                                  {/* slider container */}
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between text-muted small fw-bold mb-1">
                                      <span>{formatTime(currentTime)}</span>
                                      <span>
                                        {formatTime(
                                          parseInt(
                                            song.duration.replace("s", ""),
                                          ),
                                        )}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      className="custom-audio-slider"
                                      min="0"
                                      max={parseInt(
                                        song.duration.replace("s", ""),
                                      )}
                                      value={currentTime}
                                      // progress percentage calculation
                                      style={
                                        {
                                          "--progress": `${(currentTime / parseInt(song.duration.replace("s", ""))) * 100}%`,
                                        } as React.CSSProperties
                                      }
                                      onChange={(e) => {
                                        const seekTime = parseFloat(
                                          e.target.value,
                                        );
                                        Tone.getTransport().seconds = seekTime;
                                        setCurrentTime(seekTime);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="mb-1">{song.title}</h4>

                                <p className="text-muted mb-2">
                                  From {song.album} by {song.artist}
                                </p>

                                <button className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-hand-thumbs-up"></i> Like{" "}
                                  {song.likes}
                                </button>

                                {/* Review Section */}
                                <div className="mt-3 pt-2 border-top">
                                  <small
                                    className="text-muted text-uppercase fw-bold"
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    Listener Review
                                  </small>
                                  <p
                                    className="fst-italic text-secondary"
                                    style={{ fontSize: "0.95rem" }}
                                  >
                                    <i className="bi bi-chat-quote-fill me-1"></i>{" "}
                                    "{song.review}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="row g-4">
              {/* Skeleton or card render*/}
              {isLoading && songs.length === 0
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="col-12 col-md-6 col-lg-4">
                      <SongSkeleton />
                    </div>
                  ))
                : songs.map((song) => (
                    <div key={song.id} className="col-12 col-md-6 col-lg-4">
                      <div className="card shadow-sm h-100">
                        <div className="card-body">
                          <h5 className="card-title">{song.title}</h5>
                          <p className="card-text text-muted">
                            {song.artist} - {song.album}
                          </p>
                          <span className="badge bg-secondary">
                            {song.genre}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}

          {/* Loading indicator for infinite scroll */}
          {isLoading && songs.length > 0 && (
            <div className="text-center py-4">
              <div
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              ></div>
              <span className="ms-2 text-muted">Loading more songs...</span>
            </div>
          )}

          {/* Pagination (Only for Table View) */}
          {viewMode === "table" && (
            <nav className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                  >
                    &laquo; Prev
                  </button>
                </li>

                {[page, page + 1, page + 2].map((p) => (
                  <li
                    key={p}
                    className={`page-item ${page === p ? "active" : ""}`}
                  >
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}

                <li className="page-item">
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                  >
                    Next &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
