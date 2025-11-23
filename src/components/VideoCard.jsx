import React from 'react';
import { ThumbsUp, ThumbsDown, Play, Eye, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VideoCard = ({ video, onClick }) => {   // ← onClick ekledik
  const { t } = useLanguage();

  return (
    <div className="video-card" onClick={onClick} style={{ cursor: 'pointer' }}> {/* ← tıklanabilir yaptık */}
      <div className="video-thumbnail">
        <img src={video.thumbnail || video.image_url} alt={video.title} loading="lazy" /> {/* API için fallback */}
        <div className="play-overlay">
          <Play className="play-icon" size={48} fill="currentColor" />
        </div>
        <div className="video-duration">
          <Clock size={14} />
          <span>{video.duration || '---'}</span> {/* API'de duration yoksa bozmasın */}
        </div>
      </div>

      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>

        <div className="video-meta">
          <span className="video-username">{video.username || video.author}</span>
          <div className="video-views">
            <Eye size={14} />
            <span>{video.views || 0}</span>
          </div>
        </div>

        <div className="video-reactions">
          <button className="reaction-btn pix-btn" aria-label="Pix">
            <ThumbsUp size={16} />
            <span>{video.pix || 0}</span>
          </button>
          <button className="reaction-btn pox-btn" aria-label="Pox">
            <ThumbsDown size={16} />
            <span>{video.pox || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
