// domain_transformer.js



function runTransformData() {
    const input = document.getElementById('domainInput').value.trim();
    if (!input) {
        alert("Please enter domains or URLs.");
        return;
    }

    const lines = input.split(/\r?\n/).map(line => line.trim()).filter(line => line);

    const prependHttp = document.getElementById('prependHttp').checked;
    const prependHttps = document.getElementById('prependHttps').checked;
    const addWww = document.getElementById('addWww').checked;
    const removeProtocol = document.getElementById('removeProtocol').checked;
    const removeWww = document.getElementById('removeWww').checked;
    const removeSubdomains = document.getElementById('removeSubdomains').checked;
    const keepOnlyTLD = document.getElementById('keepOnlyTLD').checked;

    const addPrefix = document.getElementById('addPrefix').checked;
    const prefixText = document.getElementById('prefixText').value;

    const addSuffix = document.getElementById('addSuffix').checked;
    const suffixText = document.getElementById('suffixText').value;

    const removePrefix = document.getElementById('removePrefix').checked;
    const removePrefixText = document.getElementById('removePrefixText').value;

    const removeSuffix = document.getElementById('removeSuffix').checked;
    const removeSuffixText = document.getElementById('removeSuffixText').value;

    const transformed = lines.map(url => {
        let newUrl = url;

        // --- ADD RULES FIRST ---
        // Add protocol if missing
        if (!/^https?:\/\//.test(newUrl)) {
            if (prependHttps) {
                newUrl = 'https://' + newUrl;
            } else if (prependHttp) {
                newUrl = 'http://' + newUrl;
            }
        }

        // Add www if missing
        if (addWww && !/^www\./.test(newUrl.replace(/^https?:\/\//, ''))) {
            newUrl = newUrl.replace(/^(https?:\/\/)?/, '$1www.');
        }

        // Custom prefix/suffix additions
        if (addPrefix && prefixText) {
            newUrl = prefixText + newUrl;
        }
        if (addSuffix && suffixText) {
            newUrl = newUrl + suffixText;
        }

        // --- REMOVE RULES AFTER ---
        // Remove protocol
        if (removeProtocol) {
            newUrl = newUrl.replace(/^https?:\/\//, '');
        }

        // Remove www (even if after protocol)
        if (removeWww) {
            newUrl = newUrl.replace(/^(https?:\/\/)?www\./, '$1');
        }

        // Remove subdomains (but keep the main domain and TLD, including multi-part TLDs like .co.uk)
        if (removeSubdomains) {
            let domainOnly = newUrl;
            if (removeProtocol) {
                domainOnly = domainOnly.replace(/^https?:\/\//, '');
            } else {
                domainOnly = domainOnly.replace(/^https?:\/\//, '$&'); // Keep protocol if present
            }

            let protocolMatch = domainOnly.match(/^https?:\/\//);
            let protocol = protocolMatch ? protocolMatch[0] : '';
            let host = domainOnly.replace(/^https?:\/\//, '').split('/')[0]; // Remove path if any
            let parts = host.split('.');
            let ccTLDs = ['uk', 'de', 'fr', 'au', 'nz', 'jp', 'in', 'my', 'br', 'za', 'pt', 'cn', 'co', 'mx', 'tw', 'hk', 'ph', 'ar'];

            // Add custom ccTLD if provided
            const customCcTLD = document.getElementById('customCcTLD').value.trim().toLowerCase();
            if (customCcTLD) {
                ccTLDs.push(customCcTLD);
            }

            if (parts.length > 2) {
                const secondLast = parts[parts.length - 2];
                const last = parts[parts.length - 1];

                if (ccTLDs.includes(last) && secondLast.length <= 3) {
                    host = parts.slice(-3).join('.');
                } else {
                    host = parts.slice(-2).join('.');
                }
            }

            newUrl = protocol + host;
        }

        // Remove directories
        if (document.getElementById('removeDirectories').checked) {
            // If protocol exists, keep protocol + domain only
            if (/^https?:\/\//.test(newUrl)) {
                newUrl = newUrl.replace(/^(https?:\/\/[^\/]+)(\/.*)?$/, '$1');
            } else {
                // No protocol: keep domain only
                newUrl = newUrl.replace(/^([^\/]+)(\/.*)?$/, '$1');
            }
        }

        // Remove query strings and fragments
        if (document.getElementById('removeQuery').checked) {
            newUrl = newUrl.replace(/(\?.*|#.*)$/, ''); // Removes ?query and #fragment
        }

        // Remove everything but the TLD
        if (keepOnlyTLD) {
            // Remove protocol
            let domainOnly = newUrl.replace(/^https?:\/\//, '');

            // Remove query strings and fragments
            domainOnly = domainOnly.replace(/(\?.*|#.*)$/, '');

            // Remove directories (anything after first slash)
            domainOnly = domainOnly.split('/')[0];

            // Split into parts
            let parts = domainOnly.split('.');
            let ccTLDs = ['uk', 'de', 'fr', 'au', 'nz', 'jp', 'in', 'my', 'br', 'za', 'pt', 'cn', 'co', 'mx', 'tw', 'hk', 'ph', 'ar'];

            const customCcTLD_keepOnlyTLD = document.getElementById('customCcTLD_keepOnlyTLD').value.trim().toLowerCase();
            if (customCcTLD_keepOnlyTLD) ccTLDs.push(customCcTLD_keepOnlyTLD);

            if (parts.length >= 2) {
                const secondLast = parts[parts.length - 2];
                const last = parts[parts.length - 1];

                if (ccTLDs.includes(last) && secondLast.length <= 3) {
                    newUrl = secondLast + '.' + last; // e.g., co.uk
                } else {
                    newUrl = last; // Just the TLD
                }
            }
        }


        // Remove custom prefix/suffix
        if (removePrefix && removePrefixText && newUrl.startsWith(removePrefixText)) {
            newUrl = newUrl.slice(removePrefixText.length);
        }
        if (removeSuffix && removeSuffixText && newUrl.endsWith(removeSuffixText)) {
            newUrl = newUrl.slice(0, -removeSuffixText.length);
        }

        return { original: url, transformed: newUrl };
    });

    // Display results in table
    const table = document.getElementById('resultsTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    transformed.forEach(item => {
        const row = `<tr><td>${item.original}</td><td>${item.transformed}</td></tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    table.style.display = 'table';

    // Show CSV export button
    const exportBtn = document.getElementById('exportCsvBtn');
    exportBtn.style.display = 'inline';
    exportBtn.onclick = () => exportToCsv(transformed);


    // Show Copy All Transformed button
    const copyBtn = document.getElementById('copyAllBtn');
    copyBtn.style.display = 'inline';
    copyBtn.onclick = () => copyAllTransformed(transformed);
}

function exportToCsv(data) {
    let csvContent = "data:text/csv;charset=utf-8,input_data,transformed_data\n";
    data.forEach(row => {
        csvContent += `${row.original},${row.transformed}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transformed_domains.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copyAllTransformed(data) {
    const allUrls = data.map(row => row.transformed).join('\n');
    navigator.clipboard.writeText(allUrls).then(() => {
        alert("All transformed URLs copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy: ", err);
    });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // ==============================
    // Toggle All Buttons
    // ==============================
    const selectAllAddBtn = document.getElementById('selectAllAddBtn');
    const selectAllRemoveBtn = document.getElementById('selectAllRemoveBtn');

    // All Add checkboxes except custom prefix/suffix and prependHttps
    const addCheckboxes = Array.from(document.querySelectorAll('#addSection input[type="checkbox"]'))
        .filter(el => el.id !== 'addPrefix' && el.id !== 'addSuffix' && el.id !== 'prependHttps');

    // All Remove checkboxes except keepOnlyTLD and custom prefix/suffix
    const removeCheckboxes = Array.from(document.querySelectorAll('#removeSection input[type="checkbox"]'))
        .filter(el => el.id !== 'keepOnlyTLD' && el.id !== 'removePrefix' && el.id !== 'removeSuffix');

    // Track toggle states
    let addSelected = false;
    let removeSelected = false;

    // Toggle Add button
    selectAllAddBtn.addEventListener('click', () => {
        addSelected = !addSelected;
        addCheckboxes.forEach(cb => {
            cb.checked = addSelected;
            cb.dispatchEvent(new Event('change'));
        });
        selectAllAddBtn.textContent = addSelected ? 'Deselect All Common' : 'Select All Common';
    });

    // Toggle Remove button
    selectAllRemoveBtn.addEventListener('click', () => {
        removeSelected = !removeSelected;
        removeCheckboxes.forEach(cb => {
            cb.checked = removeSelected;
            cb.dispatchEvent(new Event('change'));
        });
        selectAllRemoveBtn.textContent = removeSelected ? 'Deselect All Common' : 'Select All Common';
    });

    // ==============================
    // Subdomain ccTLD Input Enable/Disable
    // ==============================
    const removeSubdomainsCheckbox = document.getElementById('removeSubdomains');
    const customCcTLDInput = document.getElementById('customCcTLD');

    // Disable by default
    customCcTLDInput.disabled = !removeSubdomainsCheckbox.checked;

    // Toggle on checkbox change
    removeSubdomainsCheckbox.addEventListener('change', function () {
        customCcTLDInput.disabled = !this.checked;
    });

    // ==============================
    // TLD ccTLD Input Enable/Disable
    // ==============================
    const keepOnlyTLDCheckbox = document.getElementById('keepOnlyTLD');
    const customCcTLDKeepOnlyTLDInput = document.getElementById('customCcTLD_keepOnlyTLD');

    // Collect all checkboxes and text inputs except domainInput, buttons, keepOnlyTLD, customCcTLD_keepOnlyTLD, and customCcTLD
    const allInputs = Array.from(document.querySelectorAll('input[type="checkbox"], input[type="text"]'))
        .filter(el => el.id !== 'domainInput' && el.id !== 'keepOnlyTLD' && el.id !== 'customCcTLD_keepOnlyTLD' && el.id !== 'customCcTLD');

    // Function to toggle states based on keepOnlyTLD
    function toggleInputs() {
        const isActive = keepOnlyTLDCheckbox.checked;
        allInputs.forEach(el => el.disabled = isActive);
        customCcTLDKeepOnlyTLDInput.disabled = !isActive;
    }

    // Initialize state on page load
    toggleInputs();

    // Listen for changes on keepOnlyTLD
    keepOnlyTLDCheckbox.addEventListener('change', toggleInputs);

});
