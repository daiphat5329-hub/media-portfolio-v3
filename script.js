// --- Thư viện CDN sẽ được load trong HTML, script này giả định GSAP và Lenis đã có sẵn ---
document.addEventListener('DOMContentLoaded', () => {



    // 2. Navbar Styling on Scroll (Removed hide logic, just background opacity if needed)
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            if(window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
                navbar.style.background = 'transparent';
                navbar.style.backdropFilter = 'none';
            }
        }
    });

    const isIndex = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
    const isPortfolio = window.location.pathname.includes('portfolio.html');
    const isProjectDetail = window.location.pathname.includes('project-detail.html');
    const isAbout = window.location.pathname.includes('about.html');
    const isServices = window.location.pathname.includes('services.html');

    // 3. Fetch Global Site Data
    fetch('data/site.json')
        .then(res => res.json())
        .then(data => {
            if(!data.site) return;
            const site = data.site;
            
            // Update Footer
            const footerNames = document.querySelectorAll('#footer-name');
            footerNames.forEach(fn => fn.textContent = site.name);

            if (isIndex) {
                const heroTagline = document.getElementById('hero-tagline');
                const heroSub = document.getElementById('hero-subtagline');
                const heroBg = document.getElementById('hero-bg-img');
                const aboutShort = document.getElementById('about-short-text');
                
                if(heroTagline) heroTagline.textContent = site.tagline;
                if(heroSub) heroSub.textContent = site.sub_tagline;
                if(heroBg && site.hero_bg) heroBg.style.backgroundImage = `url('${site.hero_bg}')`;
                if(aboutShort) aboutShort.innerHTML = `<p>${site.about_short}</p>`;
            }

            if (isAbout) {
                const aboutLong = document.getElementById('about-long-text');
                if(aboutLong) aboutLong.innerHTML = (typeof marked !== 'undefined') ? marked.parse(site.about_long || '') : site.about_long;
            }

            if (isServices) {
                const servicesList = document.getElementById('services-list');
                if(servicesList && site.services) {
                    servicesList.innerHTML = '';
                    site.services.forEach(srv => {
                        servicesList.innerHTML += `
                            <div class="service-item">
                                <h3 class="huge-text text-stroke">${srv.name}</h3>
                                <p>${srv.desc}</p>
                            </div>
                        `;
                    });
                }
            }
        });

    // 4. Fetch Projects Data
    fetch('data/projects.json')
        .then(response => response.json())
        .then(data => {
            if (!data.items) return;
            if (isProjectDetail) renderProjectDetail(data.items);
            else if (isIndex || isPortfolio) renderPortfolioGrid(data.items, isIndex);
        });

    function renderPortfolioGrid(items, limitItems) {
        const grid = document.getElementById('portfolio-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const itemsToRender = limitItems ? items.slice(0, 4) : items;

        itemsToRender.forEach((project, index) => {
            const hasDetail = !!project.slug;
            const linkAttr = hasDetail ? `data-link="project-detail.html?id=${project.slug}"` : '';
            const videoAttr = (!hasDetail && project.videoId) ? `data-video-id="${project.videoId}"` : '';
            const vfxClass = project.isVFX ? 'vfx-card' : '';
            
            let innerHTML = '';
            
            if (project.isVFX && project.vfxAfter && project.vfxBefore) {
                innerHTML = `
                    <div class="vfx-slider">
                        <div class="vfx-image after-image" style="background-image: url('${project.vfxAfter}')">
                            <span class="vfx-label label-after">FINAL</span>
                        </div>
                        <div class="vfx-image before-image" style="background-image: url('${project.vfxBefore}')">
                            <span class="vfx-label label-before">RAW</span>
                        </div>
                        <input type="range" min="0" max="100" value="50" class="vfx-range">
                        <div class="slider-handle"></div>
                    </div>
                `;
            } else {
                innerHTML = `<div class="card-image" style="background-image: url('${project.thumbnail}')"></div>`;
            }

            innerHTML += `
                <div class="card-overlay">
                    <p>${project.type}</p>
                    <h3>${project.title}</h3>
                </div>
            `;

            const cardHTML = `
                <div class="portfolio-card mix ${project.category || ''} ${vfxClass} gs-reveal" ${videoAttr} ${linkAttr} style="transition-delay: ${index * 0.1}s">
                    ${innerHTML}
                </div>
            `;
            
            grid.insertAdjacentHTML('beforeend', cardHTML);
        });
        
        initPortfolioLogic();
        initGSAPAnimations(); // Re-init GSAP for newly added items
    }

    function renderProjectDetail(items) {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('id');
        const project = items.find(p => p.slug === slug);
        
        if (!project) return;

        document.title = project.title + " | Media Production";
        document.getElementById('pd-title').textContent = project.title;
        document.getElementById('pd-type').textContent = project.type;
        
        const heroBg = document.getElementById('pd-hero-bg');
        if(heroBg) heroBg.style.backgroundImage = `url('${project.vfxAfter || project.thumbnail}')`;

        if (project.videoId) {
            document.getElementById('pd-video-section').style.display = 'block';
            document.getElementById('pd-video').src = `https://www.youtube.com/embed/${project.videoId}?rel=0`;
        }

        const descEl = document.getElementById('pd-desc');
        if (project.description) descEl.innerHTML = (typeof marked !== 'undefined') ? marked.parse(project.description) : project.description;

        if (project.credits && project.credits.length > 0) {
            const cList = document.getElementById('pd-credits');
            cList.innerHTML = '';
            project.credits.forEach(c => cList.innerHTML += `<li><strong style="color:var(--primary-color)">${c.role}</strong><br>${c.name}</li>`);
        } else {
            document.getElementById('pd-credits-section').style.display = 'none';
        }

        if (project.isVFX && project.vfxAfter && project.vfxBefore) {
            document.getElementById('pd-vfx-section').style.display = 'block';
            document.getElementById('pd-vfx-after').style.backgroundImage = `url('${project.vfxAfter}')`;
            document.getElementById('pd-vfx-before').style.backgroundImage = `url('${project.vfxBefore}')`;
            
            const range = document.getElementById('pd-vfx-range');
            const beforeImg = document.getElementById('pd-vfx-before');
            const handle = document.getElementById('pd-vfx-handle');
            
            range.addEventListener('input', (e) => {
                const val = e.target.value;
                beforeImg.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
                handle.style.left = `${val}%`;
            });
        }

        if (project.gallery && project.gallery.length > 0) {
            document.getElementById('pd-gallery-section').style.display = 'block';
            const gList = document.getElementById('pd-gallery');
            gList.innerHTML = '';
            project.gallery.forEach(g => gList.innerHTML += `<img src="${g}" style="width:100%; margin-bottom:20px; object-fit:cover;">`);
        }

        const relatedSection = document.getElementById('pd-related-section');
        const relatedGrid = document.getElementById('pd-related');
        if (relatedSection && relatedGrid) {
            const relatedProjects = items.filter(p => p.category === project.category && p.slug !== project.slug).slice(0, 3);
            if (relatedProjects.length > 0) {
                relatedSection.style.display = 'block';
                relatedGrid.innerHTML = '';
                relatedProjects.forEach((proj, index) => {
                    const hasDetail = !!proj.slug;
                    const linkAttr = hasDetail ? `data-link="project-detail.html?id=${proj.slug}"` : '';
                    const videoAttr = (!hasDetail && proj.videoId) ? `data-video-id="${proj.videoId}"` : '';
                    const vfxClass = proj.isVFX ? 'vfx-card' : '';
                    let innerHTML = '';
                    if (proj.isVFX && proj.vfxAfter && proj.vfxBefore) {
                        innerHTML = `
                            <div class="vfx-slider">
                                <div class="vfx-image after-image" style="background-image: url('${proj.vfxAfter}')"></div>
                                <div class="vfx-image before-image" style="background-image: url('${proj.vfxBefore}')"></div>
                                <input type="range" min="0" max="100" value="50" class="vfx-range">
                                <div class="slider-handle"></div>
                            </div>
                        `;
                    } else {
                        innerHTML = `<div class="card-image" style="background-image: url('${proj.thumbnail}')"></div>`;
                    }
                    innerHTML += `
                        <div class="card-overlay">
                            <p>${proj.type}</p>
                            <h3>${proj.title}</h3>
                        </div>
                    `;
                    const cardHTML = `
                        <div class="portfolio-card mix ${proj.category || ''} ${vfxClass} gs-reveal" ${videoAttr} ${linkAttr} style="transition-delay: ${index * 0.1}s">
                            ${innerHTML}
                        </div>
                    `;
                    relatedGrid.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        }

        initGSAPAnimations();
        initPortfolioLogic();
    }

    function initPortfolioLogic() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const mixCards = document.querySelectorAll('.portfolio-card.mix');

        if(filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filterValue = btn.getAttribute('data-filter');

                    mixCards.forEach(card => {
                        if (filterValue === 'all' || card.classList.contains(filterValue)) {
                            card.style.display = 'block';
                            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 50);
                        } else {
                            card.style.opacity = '0'; card.style.transform = 'scale(0.9)';
                            setTimeout(() => { card.style.display = 'none'; }, 500);
                        }
                    });
                });
            });
        }

        const vfxSliders = document.querySelectorAll('.portfolio-card .vfx-slider');
        vfxSliders.forEach(slider => {
            const range = slider.querySelector('.vfx-range');
            const beforeImage = slider.querySelector('.before-image');
            const handle = slider.querySelector('.slider-handle');

            if(range && beforeImage && handle) {
                range.addEventListener('input', (e) => {
                    const sliderValue = e.target.value;
                    beforeImage.style.clipPath = `polygon(0 0, ${sliderValue}% 0, ${sliderValue}% 100%, 0 100%)`;
                    handle.style.left = `${sliderValue}%`;
                });

                let isDragging = false;
                range.addEventListener('mousedown', () => isDragging = false);
                range.addEventListener('mousemove', () => isDragging = true);
                range.addEventListener('mouseup', (e) => {
                    if (!isDragging) {
                        const card = e.target.closest('.portfolio-card');
                        if(card && card.getAttribute('data-link')) window.location.href = card.getAttribute('data-link');
                    }
                });
                range.addEventListener('touchstart', () => isDragging = false, {passive: true});
                range.addEventListener('touchmove', () => isDragging = true, {passive: true});
                range.addEventListener('touchend', (e) => {
                    if (!isDragging) {
                        const card = e.target.closest('.portfolio-card');
                        if(card && card.getAttribute('data-link')) window.location.href = card.getAttribute('data-link');
                    }
                });
            }
        });

        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('youtubePlayer');
        const closeBtn = document.querySelector('.close-modal');

        mixCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.classList.contains('vfx-card') && e.target.classList.contains('vfx-range')) return;
                
                const pageLink = card.getAttribute('data-link');
                if (pageLink && pageLink !== 'undefined') { window.location.href = pageLink; return; }
                
                const videoId = card.getAttribute('data-video-id');
                if (videoId && videoId !== 'undefined' && modal && iframe) {
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                    modal.style.display = 'block';
                }
            });
        });

        const closeModal = () => { if(modal) modal.style.display = 'none'; if(iframe) iframe.src = ''; };
        if(closeBtn) closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && modal.style.display === 'block') closeModal(); });
    }

    // 5. GSAP & Lenis Animations
    function initGSAPAnimations() {
        if(typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        // Simple Fade Up
        gsap.utils.toArray('.gs-reveal').forEach(function(elem) {
            gsap.fromTo(elem, 
                { y: 50, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 1, ease: "power3.out",
                  scrollTrigger: {
                      trigger: elem,
                      start: "top 85%",
                  }
                }
            );
        });

        // Parallax image
        gsap.utils.toArray('.split-img, .abstract-3d-img').forEach(function(img) {
            gsap.to(img, {
                yPercent: 20,
                ease: "none",
                scrollTrigger: {
                    trigger: img.parentElement,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        });
    }

    // Attempt to load GSAP, ScrollTrigger, and Lenis dynamically if not in HTML
    if(typeof gsap === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js";
        script.onload = () => {
            const st = document.createElement('script');
            st.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js";
            st.onload = () => {
                initGSAPAnimations();
            };
            document.body.appendChild(st);
        };
        document.body.appendChild(script);
    } else {
        initGSAPAnimations();
    }
});
