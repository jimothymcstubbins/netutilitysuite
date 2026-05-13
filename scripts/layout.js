// Get base path for dynamic resolution
function getBasePath() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
        const pathParts = window.location.pathname.split('/').filter(part => part);
        if (pathParts.length > 0) {
            return '/' + pathParts[0];
        }
    }
    return '';
}

const basePath = getBasePath();

// Inject header
document.getElementById("site-header").innerHTML = `
  <header>
    <nav class="navbar">
      <div class="navbar-brand">
        <img src="${basePath}/assets/logo.png" alt="Net Utility Suite" class="navbar-logo">
        <a href="${basePath}/index.html" class="logo-text">Net Utility Suite</a>
      </div>

      <ul class="nav-links">
        <li><a href="${basePath}/index.html">Home</a></li>
        <li><a href="${basePath}/pages/bulk_url_opener.html">Bulk URL Opener</a></li>
        <li><a href="${basePath}/pages/full_rdap_lookup.html">RDAP Lookup</a></li>
        <li><a href="${basePath}/pages/domain_transformer.html">Domain Transformer</a></li>
      </ul>
    </nav>
  </header>
`;

// Inject footer
document.getElementById("site-footer").innerHTML = `
  <footer>
    <p>&copy; ${new Date().getFullYear()} Net Utility Suite — Fast, privacy‑friendly web tools.</p>
  </footer>
`;
