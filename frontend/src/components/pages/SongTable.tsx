import React, { useEffect, useState } from "react";
import api from "../../Config";
import * as Tone from "tone";
import "../../styles/music_slider.css";

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  likes: number;
  duration: string;
  album: string;
  music_theory: {
    tempo: number;
    scale: string;
    progression: string[];
    notes: { note: string; duration: string; time: number }[];
  };
}

export default function SongTable() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const synthRef = React.useRef<Tone.PolySynth | null>(null);

  const [params, setParams] = useState({
    lang: "en",
    seed: 58933423,
    avgLikes: 3.7,
  });

  // Use effect for songTable API call
  useEffect(() => {
    const requestParams = { ...params, page };
    api
      .get("/songs", { params: requestParams })
      .then((res) => {
        console.log("API Response:", res.data); // res.data
        // setSongs(res.data.data);
        if (viewMode === "grid") {
          // grid view
          setSongs((prev) =>
            page === 1 ? res.data.data : [...prev, ...res.data.data],
          );
        } else {
          // table view
          setSongs(res.data.data);
        }
      })
      .catch((err) => console.error("Error:", err));
  }, [params, page, viewMode]);

  // Infinite scroll for grid view
  useEffect(() => {
    const handleScroll = () => {
      // only grid mood for scrolling
      if (viewMode === "grid") {
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 500
        ) {
          setPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  //view mode
  const switchView = (mode: "table" | "grid") => {
    setViewMode(mode);
    setPage(1);
    setSongs([]);
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

  useEffect(() => {
    if (isPlaying && playingId !== null) {
      const song = songs.find((s) => s.id === playingId);
      if (!song) return;

      // synth initialization and transport setup
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      synthRef.current = synth;

      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
      transport.bpm.value = song.music_theory.tempo;

      const part = new Tone.Part((time, value) => {
        synth.triggerAttackRelease(value.note, value.duration, time);
      }, song.music_theory.notes);

      part.start(0);

      // auto stop logic
      const durationInSeconds = parseInt(song.duration.replace("s", ""));
      transport.scheduleOnce(() => {
        pauseSong();
      }, `${durationInSeconds}s`);

      transport.start();

      return () => {
        transport.stop();
        transport.cancel();
        synth.dispose();
        synthRef.current = null;
      };
    }
  }, [isPlaying, playingId, songs]);

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

  useEffect(() => {
    // undefined or number type for animation frame ID
    let animationFrameId: number | undefined;

    const updateTime = () => {
      if (isPlaying) {
        setCurrentTime(Tone.getTransport().seconds);
        //recursively call updateTime for the next frame
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    } else {
      // if id available, cancel the animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    // cleanup function to cancel animation
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);

  // second MM:SS format function
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

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
              setPage(1);
              setParams({ ...params, lang: e.target.value });
            }}
          >
            <option value="en">English (US)</option>
            <option value="bn">Bengali</option>
            <option value="ger">Germany</option>
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
                      setExpandedId(expandedId === song.id ? null : song.id);
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
                      <span className="badge bg-secondary">{song.genre}</span>
                    </td>
                  </tr>

                  {/* Sample Expanded Row */}
                  {expandedId === song.id && (
                    <tr className="bg-white">
                      <td colSpan={5} className="p-4 border-bottom">
                        <div className="d-flex align-items-center gap-4">
                          <div
                            className="bg-dark rounded text-white d-flex align-items-center justify-content-center"
                            style={{ width: "120px", height: "120px" }}
                          >
                            Art
                          </div>
                          <div className="mt-3">
                            {/* play button and time bar in one line */}
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
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              ></i>

                              {/* slider container */}
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between text-muted small fw-bold mb-1">
                                  <span>{formatTime(currentTime)}</span>
                                  <span>
                                    {formatTime(
                                      parseInt(song.duration.replace("s", "")),
                                    )}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  className="custom-audio-slider"
                                  min="0"
                                  max={parseInt(song.duration.replace("s", ""))}
                                  value={currentTime}
                                  // progress percentage calculation
                                  style={
                                    {
                                      "--progress": `${(currentTime / parseInt(song.duration.replace("s", ""))) * 100}%`,
                                    } as React.CSSProperties
                                  }
                                  onChange={(e) => {
                                    const seekTime = parseFloat(e.target.value);
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
          {songs.map((song) => (
            <div key={song.id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">{song.title}</h5>
                  <p className="card-text text-muted">
                    {song.artist} - {song.album}
                  </p>
                  <span className="badge bg-secondary">{song.genre}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination (Only for Table View) */}
      {viewMode === "table" && (
        <nav className="d-flex justify-content-center mt-4">
          <ul className="pagination">
            {/* Previous Button */}
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(page - 1)}>
                &laquo; Prev
              </button>
            </li>

            {/* Dynamic Page Numbers */}
            {[page, page + 1, page + 2].map((p) => (
              <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(p)}>
                  {p}
                </button>
              </li>
            ))}

            {/* Next Button */}
            <li className="page-item">
              <button className="page-link" onClick={() => setPage(page + 1)}>
                Next &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
