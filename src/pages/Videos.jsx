import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VideoCard from '../components/VideoCard';
import { Filter, Grid, List, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ReactPlayer from 'react-player';

const Videos = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  const videosPerPage = 8;

  // Sayfa değiştikçe veriyi tekrar çek
  useEffect(() => {
    fetchVideos();
  }, [currentPage]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * videosPerPage;
      // API'ye limit ve offset parametrelerini gönderiyoruz
      const response = await fetch(`https://pixpox.tech/api/videos?limit=${videosPerPage}&offset=${offset}&sort=title_asc`);
      const data = await response.json();
      
      const formatted = data.videos.map(v => ({
        id: v.id,
        title: v.title,
        thumbnail: v.image_url,
        videoUrl: v.video_url,
        username: v.author,
        description: v.description,
        genre: v.genre,
        isWide: v.is_wide,
      }));

      setVideos(formatted);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => currentPage < pagination.totalPages && setCurrentPage(currentPage + 1);
  const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleVideoClick = async (video) => {
    try {
      setLoading(true);
      const response = await fetch(video.videoUrl, {
        method: "GET",
        headers: { Range: "bytes=0-" }
      });
      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "video/ogg" });
      const blobUrl = URL.createObjectURL(blob);
      setSelectedVideo({ ...video, blobUrl });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
            {t.allVideos.showing} {((currentPage - 1) * videosPerPage) + 1}-
            {Math.min(currentPage * videosPerPage, pagination.total)} {t.allVideos.of} {pagination.total} {t.allVideos.video}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn-icon"><Filter size={20} /></button>
          <button className="btn-icon active"><Grid size={20} /></button>
          <button className="btn-icon"><List size={20} /></button>
        </div>
      </div>

      <div className="video-grid">
        {videos.map(v => (
          <VideoCard key={v.id} video={v} onClick={() => handleVideoClick(v)} />
        ))}
      </div>

      {/* Pagination UI */}
      <div className="pagination">
  {/* PREV BUTONU */}
  <button 
    className="pagination-arrow"
    disabled={currentPage === 1} 
    onClick={() => setCurrentPage(prev => prev - 1)}
  >
    <ChevronLeft size={18} /> PREV
  </button>

  {/* SAYFA NUMARALARI */}
  {(() => {
    const pages = [];
    const total = pagination.totalPages || 0;
    
    for (let i = 1; i <= total; i++) {
      // İlk sayfa, son sayfa ve mevcut sayfanın 1 yanındakileri her zaman göster
      if (i === 1 || i === total || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(
          <button
            key={i}
            className={`pagination-number ${currentPage === i ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        );
      } 
      // Aralara "..." koy
      else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(<span key={`dots-${i}`} className="pagination-dots">...</span>);
      }
    }
    return pages;
  })()}

  {/* NEXT BUTONU */}
  <button 
    className="pagination-arrow"
    disabled={currentPage === pagination.totalPages} 
    onClick={() => setCurrentPage(prev => prev + 1)}
  >
    NEXT <ChevronRight size={18} />
  </button>
</div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <img src="https://video.pixpox.tech/Thumbnail/sword-attack.gif" alt="Loading..." className="loading-gif" />
            <div className="loading-text">pixpox.tech</div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}><X size={24} /></button>
            <ReactPlayer
              url={selectedVideo.videoUrl.replace(".ogv",".mp4")}
              playing
              loop
              controls
              width="100%"
              height="auto"
            />
            <h3 style={{ marginTop: 12, color: '#fff' }}>{selectedVideo.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;