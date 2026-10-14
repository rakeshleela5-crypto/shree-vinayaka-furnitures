import React, { useState, useEffect } from 'react';
import { 
  Armchair, 
  BedDouble, 
  Utensils, 
  Briefcase, 
  Sparkles, 
  Search, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  Hammer, 
  Award, 
  CheckCircle2, 
  X, 
  Star, 
  MapPin, 
  Clock, 
  Layers, 
  Server, 
  CloudLightning,
  ChevronRight
} from 'lucide-react';
import { api, type Category, type Furniture, type InquiryPayload } from './api/client';

export function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Furniture | null>(null);
  const [backendHealth, setBackendHealth] = useState<{ isConnected: boolean; database?: string }>({
    isConnected: false,
    database: 'checking'
  });
  
  // Inquiry Form State inside Modal
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check live FastAPI + PostgreSQL backend on Railway
    api.checkHealth().then(res => {
      setBackendHealth({ isConnected: res.isConnected, database: res.database });
    });

    // Fetch initial categories
    api.getCategories().then(cats => setCategories(cats));
  }, []);

  useEffect(() => {
    // Fetch filtered furniture list
    const params: { category_slug?: string; search?: string; sort_by?: string } = {};
    if (selectedCategory !== 'all') {
      params.category_slug = selectedCategory;
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (sortBy !== 'featured') {
      params.sort_by = sortBy;
    }

    api.getFurniture(params).then(items => setFurniture(items));
  }, [selectedCategory, searchQuery, sortBy]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    const payload: InquiryPayload = {
      customer_name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      furniture_id: selectedProduct ? selectedProduct.id : undefined,
      furniture_title: selectedProduct ? selectedProduct.title : undefined,
      message: formData.message || `Inquiry for ${selectedProduct?.title || 'Custom Furniture'}`,
      inquiry_type: 'quote'
    };

    try {
      await api.submitInquiry(payload);
      setInquirySuccess(true);
      setTimeout(() => {
        setFormData({ name: '', phone: '', email: '', message: '' });
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Armchair': return <Armchair size={16} />;
      case 'BedDouble': return <BedDouble size={16} />;
      case 'Utensils': return <Utensils size={16} />;
      case 'Briefcase': return <Briefcase size={16} />;
      case 'Sparkles': return <Sparkles size={16} />;
      default: return <Layers size={16} />;
    }
  };

  return (
    <div className="site-wrapper">
      {/* Top Architecture & Backend Status Bar */}
      <div className="top-status-bar">
        <div className="container top-status-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24' }}>
              <CloudLightning size={14} /> <strong>Cloudflare Pages</strong> (Frontend)
            </span>
            <span style={{ color: '#78716c' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#60a5fa' }}>
              <Server size={14} /> <strong>FastAPI & PostgreSQL on Railway</strong> (Backend)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className={`status-badge ${backendHealth.isConnected ? 'online' : 'fallback'}`}>
              <span className="status-dot"></span>
              {backendHealth.isConnected 
                ? `FastAPI + PostgreSQL Online (${backendHealth.database || 'ready'})` 
                : 'Local Mode / Railway Standby'}
            </span>
            <span style={{ color: '#a8a29e', fontSize: '0.75rem' }}>
              Direct Showroom: +91 98450 12345
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="site-header">
        <div className="container navbar">
          <a href="#" className="brand-logo" id="brand-logo">
            <div className="brand-icon-box">
              <Armchair size={24} />
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name">Shree Vinayaka</span>
              <span className="brand-tagline">Furnitures & Teak Wood Works</span>
            </div>
          </a>

          <ul className="nav-links">
            <li><a href="#catalog" className="nav-link active">Collections</a></li>
            <li><a href="#why-us" className="nav-link">Craftsmanship</a></li>
            <li><a href="#custom-orders" className="nav-link">Custom Mandirs & Teak</a></li>
            <li><a href="#showroom" className="nav-link">Visit Showroom</a></li>
          </ul>

          <div className="nav-actions">
            <a 
              href="https://wa.me/919845012345?text=Hello%20Shree%20Vinayaka%20Furnitures,%20I%20am%20interested%20in%20your%20solid%20wood%20furniture." 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-whatsapp"
              id="header-whatsapp-btn"
            >
              <MessageCircle size={16} /> WhatsApp Quote
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <div className="hero-pill">
              <Sparkles size={14} /> 100% Solid Seasoned Wood • Direct From Artisans
            </div>
            <h1 className="hero-title">
              Mastercrafted <span className="highlight">Teak Furniture</span> Built for Generations
            </h1>
            <p className="hero-description">
              Elevate your home with authentic Burma teak sofa sets, solid Sheesham dining tables, 
              hydraulic king beds, and custom-carved pooja mandirs. Handcrafted with traditional joinery, 
              superior ergonomics, and lifetime termite resistance.
            </p>
            <div className="hero-cta-group">
              <a href="#catalog" className="btn btn-primary" id="hero-explore-btn">
                Browse Collections <ChevronRight size={16} />
              </a>
              <button 
                onClick={() => setSelectedProduct(furniture[0] || null)} 
                className="btn btn-secondary"
                id="hero-custom-quote-btn"
              >
                <Hammer size={16} /> Request Custom Design
              </button>
            </div>

            <div className="hero-badges-row">
              <div className="hero-badge-item">
                <div className="badge-icon-wrap">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="badge-text-title">10 Years</div>
                  <div className="badge-text-sub">Wood Warranty</div>
                </div>
              </div>
              <div className="hero-badge-item">
                <div className="badge-icon-wrap">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="badge-text-title">Safe Delivery</div>
                  <div className="badge-text-sub">Doorstep Setup</div>
                </div>
              </div>
              <div className="hero-badge-item">
                <div className="badge-icon-wrap">
                  <Award size={20} />
                </div>
                <div>
                  <div className="badge-text-title">25+ Years</div>
                  <div className="badge-text-sub">Artisan Legacy</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual-card">
            <img 
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80" 
              alt="Shree Vinayaka Living Room Furniture Showcase" 
              className="hero-visual-image"
            />
            <div className="hero-floating-stat">
              <div className="floating-stat-item">
                <div className="floating-stat-num">10,000+</div>
                <div className="floating-stat-label">Homes Furnished</div>
              </div>
              <div style={{ width: '1px', height: '36px', background: 'var(--color-border)' }}></div>
              <div className="floating-stat-item">
                <div className="floating-stat-num">100%</div>
                <div className="floating-stat-label">Solid Teak Wood</div>
              </div>
              <div style={{ width: '1px', height: '36px', background: 'var(--color-border)' }}></div>
              <div className="floating-stat-item">
                <div className="floating-stat-num">4.9 ★</div>
                <div className="floating-stat-label">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section className="section" id="catalog">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">Handpicked Showcase</div>
            <h2 className="section-title">Explore Our Furniture Catalog</h2>
            <p className="section-desc">
              Every piece is custom crafted with precision seasoning, hand-rubbed oil finishes, 
              and premium heavy-gauge hardware.
            </p>
          </div>

          {/* Interactive Search & Filter Controls */}
          <div className="filter-bar-wrap">
            <div className="category-tabs">
              <button 
                className={`tab-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
                id="filter-tab-all"
              >
                All Collections
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`tab-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                  id={`filter-tab-${cat.slug}`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {getCategoryIcon(cat.icon)} {cat.name}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="search-input-wrap">
                <Search size={18} color="var(--color-text-subtle)" />
                <input 
                  type="text" 
                  placeholder="Search sofa, bed, teak, dining..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="furniture-search-input"
                />
              </div>

              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                id="furniture-sort-select"
              >
                <option value="featured">Sort: Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated (4.8+)</option>
              </select>
            </div>
          </div>

          {/* Furniture Product Cards Grid */}
          <div className="furniture-grid">
            {furniture.map(item => (
              <div key={item.id} className="product-card" id={`furniture-card-${item.id}`}>
                <div className="product-image-container">
                  <img 
                    src={item.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'} 
                    alt={item.title} 
                    className="product-image"
                    loading="lazy"
                  />
                  {item.is_featured && <span className="badge-featured">Bestseller</span>}
                  {item.original_price && (
                    <span className="badge-discount">
                      Save ₹{(item.original_price - item.price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="product-content">
                  <div className="product-meta-row">
                    <span className="product-category-name">{item.material || 'Solid Wood'}</span>
                    <div className="product-rating">
                      <Star size={14} fill="#eab308" color="#eab308" />
                      <span>{item.rating} ({item.reviews_count})</span>
                    </div>
                  </div>

                  <h3 className="product-title">{item.title}</h3>
                  <p className="product-description">{item.description}</p>

                  <div className="product-specs-list">
                    {item.dimensions && <div><strong>Dimensions:</strong> {item.dimensions}</div>}
                    {item.warranty && <div><strong>Warranty:</strong> {item.warranty}</div>}
                  </div>

                  <div className="product-price-action-row">
                    <div className="price-box">
                      <span className="current-price">₹{item.price.toLocaleString('en-IN')}</span>
                      {item.original_price && (
                        <span className="original-price">₹{item.original_price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => {
                        setSelectedProduct(item);
                        setInquirySuccess(false);
                      }}
                      id={`inquire-btn-${item.id}`}
                    >
                      Inquire / Quote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {furniture.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', marginTop: '2rem' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                No furniture matched your search query.
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us & Craftsmanship */}
      <section className="section" style={{ background: '#f5efe6', borderTop: '1px solid var(--color-border)' }} id="why-us">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">The Vinayaka Standard</div>
            <h2 className="section-title">Why Discerning Families Choose Us</h2>
            <p className="section-desc">
              We never compromise on timber grades, seasoned moisture levels, or artisanal joinery.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Hammer size={26} />
              </div>
              <h3 className="feature-title">Pure Burma & CP Teak</h3>
              <p className="feature-desc">
                100% natural solid wood with zero synthetic sawdust, particle boards, or cheap veneers. 
                Naturally rich in oils for lifelong water and termite protection.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Sparkles size={26} />
              </div>
              <h3 className="feature-title">Custom Sizing & Fabric</h3>
              <p className="feature-desc">
                Have an exact room dimension or specific fabric preference? Our in-house master carpenters 
                tailor every dimension, polish color, and cushion density to your vision.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <ShieldCheck size={26} />
              </div>
              <h3 className="feature-title">10-Year Warranty</h3>
              <p className="feature-desc">
                Complete peace of mind. Every dining set, sofa frame, and wooden bed comes backed 
                with comprehensive structural and anti-borer guarantees.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <Truck size={26} />
              </div>
              <h3 className="feature-title">White Glove Delivery</h3>
              <p className="feature-desc">
                Delivered safely in padded protective wrap by our trained logistics team, 
                including complete unboxing, leveling, and placement in your living space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Visit & Direct Contact Banner */}
      <section className="section" id="showroom">
        <div className="container">
          <div className="showroom-banner">
            <div className="showroom-grid">
              <div>
                <h2 className="showroom-title">Experience the Wood in Person at Our Showroom</h2>
                <p className="showroom-desc">
                  Touch the grains, test the cushioning comfort, and discuss bespoke architectural plans 
                  with our wood artisans. Live furniture sets displayed over 10,000 sq.ft.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <a href="tel:+919845012345" className="btn btn-primary" id="call-showroom-btn">
                    <Phone size={16} /> Call +91 98450 12345
                  </a>
                  <a 
                    href="https://wa.me/919845012345?text=Hello%20Shree%20Vinayaka%20Furnitures,%20I%20would%20like%20to%20schedule%20a%20showroom%20visit." 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-whatsapp"
                    id="whatsapp-showroom-btn"
                  >
                    <MessageCircle size={16} /> Schedule Showroom Visit
                  </a>
                </div>
              </div>

              <div className="showroom-contact-card">
                <div className="contact-row">
                  <MapPin size={20} className="contact-icon" />
                  <div>
                    <div className="contact-label">Showroom Address</div>
                    <div className="contact-val">
                      Shree Vinayaka Furnitures, Main Ring Road, Furniture Hub, Bangalore - 560068
                    </div>
                  </div>
                </div>

                <div className="contact-row">
                  <Clock size={20} className="contact-icon" />
                  <div>
                    <div className="contact-label">Visiting Hours</div>
                    <div className="contact-val">Open 7 Days a Week: 10:00 AM - 9:00 PM</div>
                  </div>
                </div>

                <div className="contact-row">
                  <Phone size={20} className="contact-icon" />
                  <div>
                    <div className="contact-label">Customer Support</div>
                    <div className="contact-val">+91 98450 12345 / support@shreevinayakafurnitures.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry & Quotation Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn" 
              onClick={() => setSelectedProduct(null)}
              id="modal-close-btn"
            >
              <X size={20} />
            </button>

            <div className="modal-body-grid">
              <div>
                <img 
                  src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'} 
                  alt={selectedProduct.title} 
                  className="modal-gallery-img"
                />
                <div style={{ marginTop: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.4rem' }}>
                    {selectedProduct.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </span>
                    {selectedProduct.original_price && (
                      <span style={{ textDecoration: 'line-through', color: 'var(--color-text-subtle)' }}>
                        ₹{selectedProduct.original_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Material:</strong> {selectedProduct.material}</p>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Dimensions:</strong> {selectedProduct.dimensions}</p>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Warranty:</strong> {selectedProduct.warranty}</p>
                    <p>{selectedProduct.description}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Get Instant Price Quote & Customization
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  Leave your contact details and our master craftsman will send you detailed wood swatches, 
                  custom sizing plans, and best pricing.
                </p>

                {inquirySuccess ? (
                  <div style={{ 
                    background: 'var(--color-forest-light)', 
                    color: 'var(--color-forest)', 
                    padding: '2rem 1.5rem', 
                    borderRadius: 'var(--radius-lg)', 
                    textAlign: 'center' 
                  }}>
                    <CheckCircle2 size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <h5 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Inquiry Received Successfully!
                    </h5>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                      Our furniture advisor will connect with you via WhatsApp / Phone within 30 minutes.
                    </p>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setSelectedProduct(null)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="inquiry-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="inquiry-name">Your Full Name *</label>
                      <input 
                        type="text" 
                        id="inquiry-name"
                        required
                        className="form-control"
                        placeholder="e.g. Ramesh Chandra"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inquiry-phone">WhatsApp / Phone Number *</label>
                      <input 
                        type="tel" 
                        id="inquiry-phone"
                        required
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inquiry-email">Email Address (Optional)</label>
                      <input 
                        type="email" 
                        id="inquiry-email"
                        className="form-control"
                        placeholder="ramesh@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="inquiry-message">Custom Requirements or Sizing</label>
                      <textarea 
                        id="inquiry-message"
                        rows={3}
                        className="form-control"
                        placeholder="Need custom 7-seater layout, specific wood polish, delivery to..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      id="inquiry-submit-btn"
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      {isSubmitting ? 'Submitting to Railway Backend...' : 'Submit Quote Request'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                      <a 
                        href={`https://wa.me/919845012345?text=Hello%20Vinayaka%20Furnitures,%20I%20am%20inquiring%20about%20the%20${encodeURIComponent(selectedProduct.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.85rem', color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
                      >
                        ⚡ Or chat directly on WhatsApp
                      </a>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
                  <Armchair size={20} />
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#ffffff', fontWeight: 700 }}>
                  Shree Vinayaka Furnitures
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.7', color: '#a8a29e', marginBottom: '1.25rem' }}>
                Crafting heirloom-quality Burma teak, Sheesham, and customized solid wood masterpieces 
                for modern living. Made with pride by master Indian artisans.
              </p>
              <div style={{ fontSize: '0.8rem', color: '#78716c' }}>
                Deployment Architecture: Cloudflare Pages + Railway Cloud Server
              </div>
            </div>

            <div>
              <h4 className="footer-col-title">Collections</h4>
              <ul className="footer-links">
                <li><a href="#catalog">Living Room Sofa Sets</a></li>
                <li><a href="#catalog">Solid Teak Dining Sets</a></li>
                <li><a href="#catalog">King Storage Beds</a></li>
                <li><a href="#catalog">Artisan Pooja Mandirs</a></li>
                <li><a href="#catalog">Executive Office Desks</a></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Custom Carpentry</h4>
              <ul className="footer-links">
                <li><a href="#why-us">Wood Seasoning Process</a></li>
                <li><a href="#why-us">Burma Teak Certification</a></li>
                <li><a href="#why-us">Fabric & Polish Selection</a></li>
                <li><a href="#why-us">Architectural Woodwork</a></li>
                <li><a href="#why-us">Commercial Projects</a></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Showroom & Timings</h4>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.7', color: '#a8a29e', marginBottom: '0.75rem' }}>
                Main Ring Road, Furniture Hub, Bangalore - 560068
              </p>
              <p style={{ fontSize: '0.85rem', color: '#fde68a', marginBottom: '0.5rem' }}>
                Monday - Sunday: 10:00 AM - 9:00 PM
              </p>
              <p style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                Phone: +91 98450 12345
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              © {new Date().getFullYear()} Shree Vinayaka Furnitures. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span style={{ color: '#78716c' }}>Cloudflare Pages (SPA)</span>
              <span style={{ color: '#78716c' }}>FastAPI on Railway</span>
              <span style={{ color: '#78716c' }}>PostgreSQL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a 
        href="https://wa.me/919845012345?text=Hello%20Shree%20Vinayaka%20Furnitures,%20I%20would%20like%20to%20inquire%20about%20your%20teak%20furniture%20collection." 
        target="_blank" 
        rel="noreferrer"
        className="floating-whatsapp"
        title="Chat with Furniture Expert on WhatsApp"
        id="floating-whatsapp-btn"
      >
        <MessageCircle size={30} />
      </a>
    </div>
  );
}

export default App;
