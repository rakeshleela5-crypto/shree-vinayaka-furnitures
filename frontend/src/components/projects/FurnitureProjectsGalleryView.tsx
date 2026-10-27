import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../styles/furnitureProjects.css';
import type { FurnitureProject, ProjectCategory } from '../../types/project';
import { PROJECT_CATEGORIES } from '../../types/project';
import {
  fetchProjects,
  getProjectPresignedUrl,
  uploadFileToR2,
  createProject,
  deleteProject
} from '../../api/projectClient';

interface FurnitureProjectsGalleryViewProps {
  onExitToPos?: () => void;
}

export const FurnitureProjectsGalleryView: React.FC<FurnitureProjectsGalleryViewProps> = ({
  onExitToPos
}) => {
  const [projects, setProjects] = useState<FurnitureProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All Projects');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [lightboxProject, setLightboxProject] = useState<FurnitureProject | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<FurnitureProject | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Upload Form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Living Room');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Projects from FastAPI PostgreSQL
  const loadProjects = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All Projects' ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.client_name && item.client_name.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setUploadError(null);
      if (!formTitle) {
        // Auto-generate a readable title from filename
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setFormTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setUploadError(null);
      if (!formTitle) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setFormTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadPreview(null);
    setFormTitle('');
    setFormCategory('Living Room');
    setFormClientName('');
    setFormLocation('');
    setFormDescription('');
    setUploadStage('');
    setUploadProgress(0);
    setIsSubmitting(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute Upload Flow:
  // 1. Request presigned URL from FastAPI (POST /api/projects/presigned-url)
  // 2. Direct browser upload to Cloudflare R2 via HTTP PUT
  // 3. Save metadata + public_image_url into PostgreSQL (POST /api/projects)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a project photograph to upload.');
      return;
    }
    if (!formTitle.trim()) {
      setUploadError('Please specify a project title.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      // 1. Obtain Cloudflare R2 Presigned PUT URL
      setUploadStage('1. Requesting S3 presigned upload URL from Cloudflare R2...');
      setUploadProgress(15);
      const presignedData = await getProjectPresignedUrl(
        uploadFile.name,
        uploadFile.type || 'image/jpeg'
      );

      // 2. Upload file directly from browser to Cloudflare R2
      setUploadStage('2. Streaming file directly to Cloudflare R2 edge...');
      setUploadProgress(30);
      await uploadFileToR2(presignedData.presigned_upload_url, uploadFile, (pct) => {
        // Map 0-100 to 30-85 in overall progress
        setUploadProgress(30 + Math.round((pct * 55) / 100));
      });

      // 3. Persist record in Railway PostgreSQL
      setUploadStage('3. Storing project details & public CDN URL in PostgreSQL...');
      setUploadProgress(90);
      const newProject = await createProject({
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        r2_file_key: presignedData.r2_file_key,
        image_url: presignedData.public_image_url,
        client_name: formClientName.trim() || undefined,
        location: formLocation.trim() || undefined,
        is_featured: true
      });

      setUploadProgress(100);
      setUploadStage('Upload Complete! Synchronizing gallery...');

      // Update state immediately
      setProjects((prev) => [newProject, ...prev]);

      // Close modal
      setTimeout(() => {
        resetUploadForm();
        setIsUploadModalOpen(false);
      }, 500);
    } catch (err: any) {
      console.error('Project upload error:', err);
      setUploadError(err?.message || 'An unexpected error occurred during Cloudflare R2 upload.');
      setIsSubmitting(false);
    }
  };

  // Handle Project Deletion
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProject) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteConfirmProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteConfirmProject.id));
      setDeleteConfirmProject(null);
    } catch (err: any) {
      alert(`Failed to delete project: ${err?.message || 'Server error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fp-container" id="project-showcase-view">
      {/* 1. TOP NAVBAR */}
      <header className="fp-header">
        <div className="fp-header-brand">
          <div className="fp-brand-logo-badge">🪑</div>
          <div className="fp-brand-titles">
            <h1>
              Shree Vinayaka Furnitures
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>• Projects</span>
            </h1>
            <div className="fp-brand-subtitle">
              <span>Authorised Godrej Interio Showroom</span>
              <span>•</span>
              <span style={{ color: '#10b981' }}>Cloudflare R2 Object Storage Active</span>
            </div>
          </div>
        </div>

        <div className="fp-header-actions">
          <button
            type="button"
            className="fp-btn fp-btn-secondary"
            onClick={loadProjects}
            title="Refresh projects catalog"
          >
            🔄 Refresh
          </button>

          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={() => {
              resetUploadForm();
              setIsUploadModalOpen(true);
            }}
          >
            ☁️ Upload Project to R2
          </button>

          {onExitToPos && (
            <button
              type="button"
              className="fp-btn fp-btn-secondary"
              onClick={onExitToPos}
              style={{ borderColor: '#38bdf8', color: '#38bdf8' }}
            >
              💻 Showroom POS & ERP
            </button>
          )}
        </div>
      </header>

      {/* 2. HERO BANNER */}
      <section className="fp-hero">
        <div className="fp-hero-content">
          <div className="fp-badge-r2">
            <span className="fp-stat-pulse" />
            Cloudflare R2 S3-Compatible Edge Storage
          </div>
          <h2 className="fp-hero-title">
            Crafted Furniture Projects & Bespoke Interiors
          </h2>
          <p className="fp-hero-desc">
            Explore our custom residential woodwork, luxury Godrej Interio master suites, commercial boardrooms,
            and modular kitchens. All high-resolution project photography is streamed directly from Cloudflare R2
            with zero egress costs and global edge CDN caching.
          </p>

          <div className="fp-hero-stats">
            <div className="fp-stat-item">
              <span className="fp-stat-value">{projects.length}</span>
              <span className="fp-stat-label">Published Projects</span>
            </div>
            <div className="fp-stat-item">
              <span className="fp-stat-value" style={{ color: '#38bdf8' }}>
                Cloudflare R2
              </span>
              <span className="fp-stat-label">Object Storage Engine</span>
            </div>
            <div className="fp-stat-item">
              <span className="fp-stat-value" style={{ color: '#10b981' }}>
                $0 Zero Egress
              </span>
              <span className="fp-stat-label">Bandwidth Cost</span>
            </div>
            <div className="fp-stat-item">
              <span className="fp-stat-value" style={{ color: '#f59e0b' }}>
                PostgreSQL
              </span>
              <span className="fp-stat-label">Railway Metadata Store</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TOOLBAR & FILTERS */}
      <div className="fp-toolbar">
        <div className="fp-toolbar-row">
          <div className="fp-search-box">
            <span className="fp-search-icon">🔍</span>
            <input
              type="text"
              className="fp-search-input"
              placeholder="Search projects by title, client, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '13px', color: 'var(--fp-text-secondary)' }}>
            Showing <strong>{filteredProjects.length}</strong> of {projects.length} projects
          </div>
        </div>

        {/* Category Pills */}
        <div className="fp-categories-scroll">
          {PROJECT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`fp-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN PROJECTS GRID */}
      {isLoading ? (
        <div className="fp-hero" style={{ marginTop: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔄</div>
          <div style={{ color: '#38bdf8', fontWeight: 600 }}>Loading Cloudflare R2 Projects...</div>
        </div>
      ) : errorMessage ? (
        <div className="fp-empty-state">
          <div className="fp-empty-icon">⚠️</div>
          <div className="fp-empty-title">Failed to Load Projects</div>
          <div className="fp-empty-desc">{errorMessage}</div>
          <button type="button" className="fp-btn fp-btn-primary" onClick={loadProjects}>
            Try Again
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="fp-empty-state">
          <div className="fp-empty-icon">📁</div>
          <div className="fp-empty-title">No Projects Found</div>
          <div className="fp-empty-desc">
            {searchQuery || selectedCategory !== 'All Projects'
              ? 'No projects match your current search or category filter. Try clearing filters or searching for something else.'
              : 'No furniture showcase projects have been added yet. Click below to upload your first project image directly to Cloudflare R2!'}
          </div>
          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={() => {
              setSelectedCategory('All Projects');
              setSearchQuery('');
              setIsUploadModalOpen(true);
            }}
          >
            ☁️ Upload First Project
          </button>
        </div>
      ) : (
        <div className="fp-grid">
          {filteredProjects.map((item) => (
            <article key={item.id} className="fp-card">
              <div
                className="fp-card-image-wrap"
                onClick={() => setLightboxProject(item)}
                title="Click to view full resolution image"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="fp-card-image"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to high-quality furniture placeholder if remote fails
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="fp-image-overlay">
                  <span className="fp-card-category">{item.category}</span>
                  <div className="fp-card-zoom-badge">🔍</div>
                </div>
              </div>

              <div className="fp-card-body">
                <h3 className="fp-card-title">{item.title}</h3>

                {(item.client_name || item.location) && (
                  <div className="fp-card-client">
                    <span>📍</span>
                    <span>
                      {item.client_name}
                      {item.client_name && item.location ? ' • ' : ''}
                      {item.location}
                    </span>
                  </div>
                )}

                <p className="fp-card-desc">{item.description || 'Custom showroom project showcase.'}</p>

                <div className="fp-card-footer">
                  <span className="fp-card-r2-pill" title={`Cloudflare R2 Key: ${item.r2_file_key}`}>
                    ☁️ {item.r2_file_key.split('/').pop()}
                  </span>

                  <div className="fp-card-actions">
                    <button
                      type="button"
                      className="fp-action-icon-btn"
                      onClick={() => setLightboxProject(item)}
                      title="View High-Res Photo"
                    >
                      👁️
                    </button>
                    <button
                      type="button"
                      className="fp-action-icon-btn"
                      onClick={() => setDeleteConfirmProject(item)}
                      title="Delete Project & Purge R2 Object"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 5. UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fp-modal-backdrop" onClick={() => !isSubmitting && setIsUploadModalOpen(false)}>
          <div className="fp-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fp-modal-header">
              <h3 className="fp-modal-title">
                <span>☁️</span>
                <span>Upload Furniture Project (Cloudflare R2)</span>
              </h3>
              <button
                type="button"
                className="fp-modal-close-btn"
                onClick={() => !isSubmitting && setIsUploadModalOpen(false)}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="fp-modal-body">
                {uploadError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  >
                    ⚠️ {uploadError}
                  </div>
                )}

                {/* DROPZONE / FILE INPUT */}
                {!uploadPreview ? (
                  <div
                    className="fp-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <div className="fp-dropzone-icon">📷</div>
                    <div className="fp-dropzone-title">Click to browse or drag & drop high-res photo</div>
                    <div className="fp-dropzone-sub">
                      Supports JPEG, PNG, WebP (Uploaded directly to Cloudflare R2 bucket)
                    </div>
                  </div>
                ) : (
                  <div className="fp-preview-container">
                    <img src={uploadPreview} alt="Upload Preview" className="fp-preview-image" />
                    <button
                      type="button"
                      className="fp-preview-remove-btn"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isSubmitting}
                    >
                      ✕ Change Image
                    </button>
                  </div>
                )}

                {/* FORM FIELDS */}
                <div className="fp-form-group">
                  <label className="fp-form-label">
                    Project Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="fp-input"
                    placeholder="e.g. Royal Teak 3-Seater Sofa Suite"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="fp-form-row">
                  <div className="fp-form-group">
                    <label className="fp-form-label">Category</label>
                    <select
                      className="fp-select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {PROJECT_CATEGORIES.filter((c) => c !== 'All Projects').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fp-form-group">
                    <label className="fp-form-label">Client Name / Suite</label>
                    <input
                      type="text"
                      className="fp-input"
                      placeholder="e.g. Prestige Lakeview Penthouse"
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="fp-form-group">
                  <label className="fp-form-label">Location</label>
                  <input
                    type="text"
                    className="fp-input"
                    placeholder="e.g. Koramangala, Bengaluru, Karnataka"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="fp-form-group">
                  <label className="fp-form-label">Project Description</label>
                  <textarea
                    className="fp-textarea"
                    rows={3}
                    placeholder="Describe the materials (Teakwood, Godrej steel, Italian leather), dimensions, and design highlights..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* UPLOAD PROGRESS */}
                {isSubmitting && (
                  <div className="fp-upload-progress-box">
                    <div className="fp-progress-header">
                      <span>{uploadStage}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="fp-progress-track">
                      <div className="fp-progress-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="fp-modal-footer">
                <button
                  type="button"
                  className="fp-btn fp-btn-secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fp-btn fp-btn-primary"
                  disabled={isSubmitting || !uploadFile}
                >
                  {isSubmitting ? 'Uploading to R2...' : '🚀 Upload to Cloudflare R2'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. LIGHTBOX MODAL */}
      {lightboxProject && (
        <div className="fp-modal-backdrop" onClick={() => setLightboxProject(null)}>
          <div className="fp-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fp-lightbox-image-wrap">
              <img
                src={lightboxProject.image_url}
                alt={lightboxProject.title}
                className="fp-lightbox-image"
              />
            </div>
            <div className="fp-lightbox-footer">
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '18px' }}>
                  {lightboxProject.title}
                </h4>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {lightboxProject.category}
                  {lightboxProject.client_name ? ` • ${lightboxProject.client_name}` : ''}
                  {lightboxProject.location ? ` (${lightboxProject.location})` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={lightboxProject.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fp-btn fp-btn-secondary"
                >
                  🔗 Open Full Size
                </a>
                <button
                  type="button"
                  className="fp-btn fp-btn-primary"
                  onClick={() => setLightboxProject(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deleteConfirmProject && (
        <div className="fp-modal-backdrop" onClick={() => !isDeleting && setDeleteConfirmProject(null)}>
          <div
            className="fp-modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fp-modal-header">
              <h3 className="fp-modal-title" style={{ color: '#f87171' }}>
                <span>🗑️</span>
                <span>Confirm Deletion</span>
              </h3>
              <button
                type="button"
                className="fp-modal-close-btn"
                onClick={() => !isDeleting && setDeleteConfirmProject(null)}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>
            <div className="fp-modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                Are you sure you want to permanently delete project{' '}
                <strong style={{ color: '#fff' }}>"{deleteConfirmProject.title}"</strong>?
              </p>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fca5a5'
                }}
              >
                ⚠️ This will purge the image object from <strong>Cloudflare R2 Storage</strong> and delete
                the project row from <strong>PostgreSQL</strong>. This action cannot be undone.
              </div>
            </div>
            <div className="fp-modal-footer">
              <button
                type="button"
                className="fp-btn fp-btn-secondary"
                onClick={() => setDeleteConfirmProject(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fp-btn"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting from R2...' : '🗑️ Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
