// DNS Lookup Tool using DNS-over-HTTPS (DoH)
const DNS_SERVERS = {
    cloudflare: {
        url: 'https://cloudflare-dns.com/dns-query',
        headers: { 'Accept': 'application/dns-json' }
    },
    google: {
        url: 'https://dns.google/resolve',
        headers: { 'Accept': 'application/dns-json' }
    },
    quad9: {
        url: 'https://dns.quad9.net:5053/dns-query',
        headers: { 'Accept': 'application/dns-json' }
    },
    opendns: {
        url: 'https://doh.opendns.com/dns-query',
        headers: { 'Accept': 'application/dns-json' }
    }
};

const RECORD_TYPES = {
    'a': 1,
    'aaaa': 28,
    'mx': 15,
    'txt': 16,
    'cname': 5,
    'ns': 2,
    'soa': 6,
    'caa': 257
};

async function lookupDNS() {
    const domain = document.getElementById('domain').value.trim();
    const serverSelect = document.getElementById('dns-server').value;
    const outputContainer = document.getElementById('output-container');
    const output = document.getElementById('output');
    
    outputContainer.style.display = 'block';
    output.innerHTML = '';
    
    // Hide action buttons initially
    document.getElementById('copyBtn').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';

    if (!domain) {
        output.innerHTML = '<div class="error">Please enter a domain name.</div>';
        return;
    }

    // Get selected record types
    const selectedRecords = [];
    Object.keys(RECORD_TYPES).forEach(type => {
        const checkbox = document.getElementById(`record-${type}`);
        if (checkbox && checkbox.checked) {
            selectedRecords.push(type);
        }
    });

    if (selectedRecords.length === 0) {
        output.innerHTML = '<div class="error">Please select at least one record type.</div>';
        return;
    }

    const server = DNS_SERVERS[serverSelect];
    const results = {};

    output.innerHTML = '<div class="loading">Looking up DNS records...</div>';

    try {
        // Perform lookups for each selected record type
        for (const recordType of selectedRecords) {
            output.innerHTML = `<div class="loading">Looking up ${recordType.toUpperCase()} records...</div>`;
            
            const url = `${server.url}?name=${encodeURIComponent(domain)}&type=${RECORD_TYPES[recordType]}`;
            const response = await fetch(url, { headers: server.headers });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            results[recordType] = data;
        }

        // Display results
        displayResults(results, domain, serverSelect);
        
        // Show action buttons
        document.getElementById('copyBtn').style.display = 'inline-block';
        document.getElementById('downloadBtn').style.display = 'inline-block';

    } catch (error) {
        output.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

function displayResults(results, domain, server) {
    const output = document.getElementById('output');
    let html = `<div class="dns-summary">
        <strong>Domain:</strong> ${domain}<br>
        <strong>DNS Server:</strong> ${server.charAt(0).toUpperCase() + server.slice(1)}<br>
        <strong>Query Time:</strong> ${new Date().toLocaleString()}
    </div>`;

    Object.keys(results).forEach(recordType => {
        const data = results[recordType];
        html += formatRecordType(recordType.toUpperCase(), data);
    });

    output.innerHTML = html;
}

function formatRecordType(recordType, data) {
    let html = `<div class="record-section">
        <h4 class="record-title">${recordType} Records</h4>`;

    if (data.Status !== 0) {
        html += `<div class="no-records">No ${recordType} records found (Status: ${data.Status})</div>`;
    } else if (!data.Answer || data.Answer.length === 0) {
        html += `<div class="no-records">No ${recordType} records found</div>`;
    } else {
        html += '<div class="record-list">';
        
        data.Answer.forEach((record, index) => {
            html += formatRecord(record, recordType, index + 1);
        });
        
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function formatRecord(record, recordType, index) {
    let html = `<div class="record-item">
        <div class="record-header">Record ${index}</div>`;

    switch (recordType.toLowerCase()) {
        case 'a':
            html += `
                <div class="record-field"><strong>IP Address:</strong> ${record.data}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'aaaa':
            html += `
                <div class="record-field"><strong>IPv6 Address:</strong> ${record.data}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'mx':
            const priority = record.data ? record.data.split(' ')[0] : 'N/A';
            const server = record.data ? record.data.split(' ').slice(1).join(' ') : 'N/A';
            html += `
                <div class="record-field"><strong>Mail Server:</strong> ${server}</div>
                <div class="record-field"><strong>Priority:</strong> ${priority}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'txt':
            html += `
                <div class="record-field"><strong>Text:</strong> <code>${record.data}</code></div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'cname':
            html += `
                <div class="record-field"><strong>Canonical Name:</strong> ${record.data}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'ns':
            html += `
                <div class="record-field"><strong>Name Server:</strong> ${record.data}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'soa':
            html += `
                <div class="record-field"><strong>Primary NS:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Admin Email:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Serial:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Refresh:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Retry:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Expire:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        case 'caa':
            html += `
                <div class="record-field"><strong>Flag:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Tag:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>Value:</strong> ${record.data || 'N/A'}</div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
            break;
            
        default:
            html += `
                <div class="record-field"><strong>Data:</strong> <code>${JSON.stringify(record.data, null, 2)}</code></div>
                <div class="record-field"><strong>TTL:</strong> ${record.TTL}s</div>
            `;
    }

    html += '</div>';
    return html;
}

function copyResults() {
    const output = document.getElementById('output');
    const text = output.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy Results';
        }, 2000);
    });
}

function downloadResults() {
    const domain = document.getElementById('domain').value.trim();
    const serverSelect = document.getElementById('dns-server').value;
    
    // Get all selected records
    const selectedRecords = {};
    Object.keys(RECORD_TYPES).forEach(type => {
        const checkbox = document.getElementById(`record-${type}`);
        if (checkbox && checkbox.checked) {
            selectedRecords[type] = true;
        }
    });

    const downloadData = {
        domain: domain,
        dns_server: serverSelect,
        query_time: new Date().toISOString(),
        record_types: Object.keys(selectedRecords),
        results: window.currentDNSResults || {}
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}_dns_lookup.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Store results globally for download function
let originalLookupDNS = lookupDNS;
lookupDNS = async function() {
    const results = await originalLookupDNS();
    window.currentDNSResults = results;
    return results;
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const domainInput = document.getElementById('domain');
    const lookupBtn = document.getElementById('lookupBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Trigger lookup on button click
    lookupBtn.addEventListener('click', lookupDNS);
    
    // Trigger lookup on Enter key
    domainInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            lookupDNS();
        }
    });
    
    // Action button listeners
    copyBtn.addEventListener('click', copyResults);
    downloadBtn.addEventListener('click', downloadResults);
    
    // Focus on input field
    domainInput.focus();
});
