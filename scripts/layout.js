// Inject header
document.getElementById("site-header").innerHTML = `
  <header>
    <nav class="navbar">
      <div class="navbar-brand">
        <img src="../assets/logo.png" alt="Net Utility Suite" class="navbar-logo">
        <a href="../index.html" class="logo-text">Net Utility Suite</a>
      </div>

      <ul class="nav-links">
        <li><a href="../index.html">Home</a></li>
        <li><a href="../pages/bulk_url_opener.html">Bulk URL Opener</a></li>
        <li><a href="../pages/rdap_lookup.html">RDAP Lookup</a></li>
        <li><a href="../pages/domain_transformer.html">Domain Transformer</a></li>
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
