import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockProjects } from '../mock/mockData';
import { ExternalLink } from 'lucide-react';

const Projects = () => {
  const { t } = useLanguage();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.projects.title}</h1>
          <p className="page-subtitle">{t.projects.subtitle}</p>
        </div>
      </div>

      <div className="projects-grid">
        {mockProjects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-image">
              <img src={project.image} alt={project.title} loading="lazy" />
              <div className="project-overlay">
                <button className="btn-view-project">
                  <ExternalLink size={20} />
                  View Project
                </button>
              </div>
            </div>
            <div className="project-content">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-tags">
                {project.tags.map((tag, index) => (
                  <span key={index} className="project-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
