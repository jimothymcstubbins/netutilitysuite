async function runRDAP() {
  const output = document.getElementById('output');
  const domain = document.getElementById('domain').value.trim();
  output.textContent = '';

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
      output.textContent += JSON.stringify(data, null, 2);
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
      const registrarResponse = await fetch(registrarLink.href);
      registrarData = await registrarResponse.json();
    }

    const finalData = registrarData && registrarData.objectClassName ? registrarData : registryData;

    // Display full RDAP JSON
    output.textContent += `\nFull RDAP Response:\n${JSON.stringify(finalData, null, 2)}\n`;

  } catch (err) {
    output.textContent += `Error: ${err.message}`;
  }
}

// Trigger runRDAP() when Enter is pressed in the domain input
document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domain');
  domainInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runRDAP();
    }
  });
});