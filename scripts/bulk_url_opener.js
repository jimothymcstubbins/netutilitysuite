// bulk_url_opener.js

document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("urlInput");
    const batchSizeInput = document.getElementById("batchSize");
    const openBatchBtn = document.getElementById("openBatchBtn");
    const removeOpenedCheckbox = document.getElementById("removeOpened");
    const prependHttpCheckbox = document.getElementById("prependHttp");
    const prepend_wwwCheckbox = document.getElementById('prepend_www');

    openBatchBtn.addEventListener("click", () => {
        const urls = urlInput.value
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

        const batchSize = parseInt(batchSizeInput.value, 10) || 1;
        const batch = urls.slice(0, batchSize);


        batch.forEach(url => {
            let normalizedUrl = url;

            // Prepend www. if needed
            if (prepend_wwwCheckbox.checked && !/^www\./i.test(normalizedUrl) && !/^https?:\/\/www\./i.test(normalizedUrl)) {
                // If it already has http(s), insert www. after it
                if (/^https?:\/\//i.test(normalizedUrl)) {
                    normalizedUrl = normalizedUrl.replace(/^(https?:\/\/)/i, '$1www.');
                } else {
                    normalizedUrl = 'www.' + normalizedUrl;
                }
            }

            // Prepend http:// if needed
            if (prependHttpCheckbox.checked && !/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = 'http://' + normalizedUrl;
            }

            // Treat as absolute URL if no protocol
            if (!prependHttpCheckbox.checked && !/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = '//' + normalizedUrl;
            }

            window.open(normalizedUrl, "_blank", "noopener,noreferrer");
        });


        if (removeOpenedCheckbox.checked) {
            const remaining = urls.slice(batchSize);
            urlInput.value = remaining.join("\n");
        }
    });
});