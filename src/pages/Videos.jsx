import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VideoCard from '../components/VideoCard';
import { Filter, Grid, List, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ReactPlayer from 'react-player';

const Videos = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const videosPerPage = 8;

  useEffect(() => {
    fetch('http://localhost:5173/api/videos?sort=random')
      .then(r => r.json())
      .then(data => {
        const formatted = data.videos.map(v => ({
          id: v.id,
          title: v.title,
          thumbnail: v.image_url,
          videoUrl: `${v.video_url}`,   // ← PROXY URL
          username: v.author,
          description: v.description,
          genre: v.genre,
          isWide: v.is_wide,
        }));
        setVideos(formatted);
      })
      .catch(console.error);
  }, []);

  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = videos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  // const handleVideoClick = (video) => setSelectedVideo(video);
  const handleVideoClick = async (video) => {
  try {

    console.log(video.videoUrl)

    console.log("video clicked")
    const response = await fetch(video.videoUrl, {
      method: "GET",
      headers: {
        Range: "bytes=0-" // request full stream with range support
      }
    });

    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: "video/ogg" });
    const blobUrl = URL.createObjectURL(blob);

    setSelectedVideo({
      ...video,
      blobUrl
    });
  } catch (e) {
    console.error(e);
  }
};

  const closeModal = () => setSelectedVideo(null);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.allVideos.title}</h1>
          <p className="page-subtitle">{t.allVideos.subtitle}</p>
          <p className="video-count">
            {t.allVideos.showing} {indexOfFirstVideo + 1}-{Math.min(indexOfLastVideo, videos.length)} {t.allVideos.of} {videos.length} {t.allVideos.video}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-icon"><Filter size={20} /></button>
          <button className="btn-icon active"><Grid size={20} /></button>
          <button className="btn-icon"><List size={20} /></button>
        </div>
      </div>

      <div className="video-grid">
        {currentVideos.map(v => (
          <VideoCard key={v.id} video={v} onClick={() => handleVideoClick(v)} />
        ))}
      </div>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={handlePrevPage}><ChevronLeft /> PREV</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} className={currentPage === i + 1 ? 'active' : ''} onClick={() => setCurrentPage(i + 1)}>
            {i + 1}
          </button>
        ))}
        <button disabled={currentPage === totalPages} onClick={handleNextPage}>NEXT <ChevronRight /></button>
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}><X size={24} /></button>

            {/* selectedVideo varsa oynat, yoksa oynatma */}
            <div>
              <ReactPlayer
                url={selectedVideo.videoUrl.replace(".ogv",".mp4")}//"https://video.pixpox.tech/Videos/7569996098387873035.mp4" // son boşluk yok
                playing
                loop
                controls          // istersen
                width="100%"
                height="auto"
              />
            </div>

            <h3 style={{ marginTop: 12, color: '#fff' }}>
              {selectedVideo.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;