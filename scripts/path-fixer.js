// Dynamic base path detection for GitHub Pages vs localhost
(function() {
    // Detect if we're on GitHub Pages by checking the hostname
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // Get the current path and determine the base path
    let basePath = '';
    
    if (isGitHubPages) {
        // Extract repository name from path
        const pathParts = window.location.pathname.split('/').filter(part => part);
        if (pathParts.length > 0) {
            basePath = '/' + pathParts[0];
        }
    }
    
    // Function to fix URLs
    function fixUrls() {
        // Fix all link elements
        const links = document.querySelectorAll('link[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('/netutilitysuite')) {
                if (href.startsWith('/')) {
                    link.setAttribute('href', basePath + href);
                } else {
                    link.setAttribute('href', basePath + '/' + href);
                }
            }
        });
        
        // Fix all script elements
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/netutilitysuite')) {
                if (src.startsWith('/')) {
                    script.setAttribute('src', basePath + src);
                } else {
                    script.setAttribute('src', basePath + '/' + src);
                }
            }
        });
        
        // Fix all anchor elements
        const anchors = document.querySelectorAll('a[href]');
        anchors.forEach(anchor => {
            const href = anchor.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('/netutilitysuite') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                if (href.startsWith('/')) {
                    anchor.setAttribute('href', basePath + href);
                } else {
                    anchor.setAttribute('href', basePath + '/' + href);
                }
            }
        });
    }
    
    // Run immediately and also when DOM is ready
    fixUrls();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixUrls);
    } else {
        fixUrls();
    }
})();
