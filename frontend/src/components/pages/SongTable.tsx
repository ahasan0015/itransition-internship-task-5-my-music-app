import React, { useEffect, useState } from "react";
import api from "../../Config";

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  likes: number;
  duration: string;
  album: string;
}

export default function SongTable() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [params, setParams] = useState({
    lang: "en",
    seed: 58933423,
    avgLikes: 3.7,
  });

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
                    onClick={() =>
                      setExpandedId(expandedId === song.id ? null : song.id)
                    }
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

                          <div>
                            <h4 className="mb-1">
                              {song.title}
                              <i className="bi bi-play-circle-fill text-primary"></i>
                            </h4>

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
