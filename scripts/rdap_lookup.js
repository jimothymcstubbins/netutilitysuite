// Unified RDAP Lookup Tool
async function runRDAP() {
    const output = document.getElementById('output');
    const domain = document.getElementById('domain').value.trim();
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const outputContainer = document.getElementById('output-container');
    
    output.textContent = '';
    outputContainer.style.display = 'block';
    
    // Hide action buttons initially
    document.getElementById('copyBtn').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';

    if (!domain) {
        output.textContent = 'Please enter a domain.';
        return;
    }

    const tld = domain.split('.').pop();
    output.textContent = 'Running...\n';

    try {
        // Special case for .de domains
        if (tld === 'de') {
            const denicUrl = `https://rdap.denic.de/domain/${domain}`;
            output.textContent += `Detected .de domain. Querying DENIC RDAP...\n`;
            const response = await fetch(denicUrl);
            const data = await response.json();
            
            if (mode === 'quick') {
                output.textContent += formatQuickOutput(data);
            } else {
                output.textContent += JSON.stringify(data, null, 2);
            }
            
            showActionButtons(mode, data);
            return;
        }

        // Get IANA bootstrap file
        const bootstrapResponse = await fetch('https://data.iana.org/rdap/dns.json');
        const bootstrapData = await bootstrapResponse.json();

        let rdapUrl = '';
        for (const service of bootstrapData.services) {
            const tlds = service[0];
            if (tlds.includes(tld)) {
                rdapUrl = service[1][0].replace(/\/$/, '');
                break;
            }
        }

        if (!rdapUrl) {
            output.textContent += `RDAP server for .${tld} not found.\n`;
            return;
        }

        const queryUrl = `${rdapUrl}/domain/${domain}`;
        output.textContent += `Querying registry RDAP at ${queryUrl}\n`;
        const registryResponse = await fetch(queryUrl);
        const registryData = await registryResponse.json();

        // Attempt to find registrar RDAP link
        let registrarData = null;
        const links = registryData.links || [];
        const registrarLink = links.find(l => l.rel === 'related' && l.type === 'application/rdap+json');
        if (registrarLink) {
            output.textContent += `Found registrar RDAP link: ${registrarLink.href}\nQuerying registrar...\n`;
            try {
                const registrarResponse = await fetch(registrarLink.href);
                registrarData = await registrarResponse.json();
            } catch (err) {
                output.textContent += `Failed to query registrar: ${err.message}\n`;
            }
        }

        const finalData = registrarData && registrarData.objectClassName ? registrarData : registryData;

        if (mode === 'quick') {
            output.textContent = formatQuickOutput(finalData);
        } else {
            output.textContent = `Full RDAP Response:\n${JSON.stringify(finalData, null, 2)}`;
        }

        showActionButtons(mode, finalData);

    } catch (err) {
        output.textContent = `Error: ${err.message}`;
    }
}

function formatQuickOutput(data) {
    const extractEntities = (data) => {
        if (!data.entities) return '';
        return data.entities
            .filter(e => e.roles?.some(r => ['registrant','administrative','technical','billing','abuse'].includes(r)))
            .map(e => {
                const role = e.roles[0];
                const vcardData = e.vcardArray?.[1] || [];
                
                let contactInfo = '';
                const name = vcardData.find(f => f[0] === 'fn')?.[3];
                const org = vcardData.find(f => f[0] === 'org')?.[3];
                const email = vcardData.find(f => f[0] === 'email')?.[3];
                const address = vcardData.find(f => f[0] === 'adr')?.[3];
                
                if (name) contactInfo += `Name: ${name}\n`;
                if (org) contactInfo += `Organization: ${org}\n`;
                if (email) contactInfo += `Email: ${email}\n`;
                if (address && Array.isArray(address)) {
                    contactInfo += `Address: ${address.filter(a => a).join(', ')}\n`;
                }
                
                return `${role.toUpperCase()}:\n${contactInfo}`;
            })
            .join('\n\n');
    };

    const registrarName = data.entities?.find(e => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(f => f[0] === 'fn')?.[3] || 'N/A';
    const createdOn = data.events?.find(ev => ev.eventAction === 'registration')?.eventDate || 'N/A';
    const expirationDate = data.events?.find(ev => ev.eventAction === 'expiration')?.eventDate || 'N/A';
    const updatedOn = data.events?.find(ev => ev.eventAction === 'last changed')?.eventDate || 'N/A';
    const nameservers = (data.nameservers || []).map(ns => typeof ns === 'string' ? ns : ns.ldhName).join('\n') || 'N/A';
    const status = (data.status || []).join(', ') || 'N/A';

    return `DOMAIN INFORMATION
==================

Domain: ${data.ldhName || 'N/A'}
Status: ${status}

REGISTRAR
=========
${registrarName}

IMPORTANT DATES
===============
Created: ${createdOn}
Expires: ${expirationDate}
Updated: ${updatedOn}

CONTACT INFORMATION
===================

${extractEntities(data)}

NAMESERVERS
===========
${nameservers}`;
}

function showActionButtons(mode, data) {
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    copyBtn.style.display = 'inline-block';
    downloadBtn.style.display = mode === 'full' ? 'inline-block' : 'none';
    
    // Copy functionality
    copyBtn.onclick = () => {
        const text = document.getElementById('output').textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Results';
            }, 2000);
        });
    };
    
    // Download functionality (only for full mode)
    if (mode === 'full') {
        downloadBtn.onclick = () => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.ldhName || 'domain'}_rdap.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const domainInput = document.getElementById('domain');
    const lookupBtn = document.getElementById('lookupBtn');
    
    // Trigger lookup on button click
    lookupBtn.addEventListener('click', runRDAP);
    
    // Trigger lookup on Enter key
    domainInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            runRDAP();
        }
    });
    
    // Focus on input field
    domainInput.focus();
});
