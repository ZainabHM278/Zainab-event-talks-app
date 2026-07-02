document.addEventListener('DOMContentLoaded', () => {
    // State management
    let allUpdates = [];
    let selectedUpdateId = null;
    let activeTypeFilter = 'all';
    let searchQuery = '';

    // Cache DOM Elements
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshSpinner = document.getElementById('refreshSpinner');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const retryBtn = document.getElementById('retryBtn');
    const noResults = document.getElementById('noResults');
    const feedContent = document.getElementById('feedContent');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    const filterChips = document.querySelectorAll('.filter-chip');
    const totalCountElem = document.getElementById('totalCount');
    
    // Composer Elements
    const composerEmptyState = document.getElementById('composerEmptyState');
    const composerActiveState = document.getElementById('composerActiveState');
    const closeComposer = document.getElementById('closeComposer');
    const tweetText = document.getElementById('tweetText');
    const charCount = document.getElementById('charCount');
    const progressRing = document.getElementById('progressRing');
    const tweetBtn = document.getElementById('tweetBtn');
    
    const linkCardTitle = document.getElementById('linkCardTitle');
    const linkCardDesc = document.getElementById('linkCardDesc');

    // Progress Ring configuration
    const circleRadius = 10;
    const circumference = 2 * Math.PI * circleRadius;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRing.style.strokeDashoffset = circumference;

    // Initial Fetch
    fetchReleaseNotes();

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeTypeFilter = chip.getAttribute('data-type');
            renderFeed();
        });
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        if (searchQuery.length > 0) {
            clearSearch.style.display = 'block';
        } else {
            clearSearch.style.display = 'none';
        }
        renderFeed();
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearch.style.display = 'none';
        renderFeed();
    });

    // Close Composer
    closeComposer.addEventListener('click', deselectAll);

    // Tweet Text Area Input
    tweetText.addEventListener('input', () => {
        updateCharCounter();
    });

    // Post to X button
    tweetBtn.addEventListener('click', () => {
        const text = tweetText.value.trim();
        if (text.length === 0) return;
        const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(xUrl, '_blank');
    });

    // Fetch releases API
    function fetchReleaseNotes() {
        showLoadingState();
        
        fetch('/api/releases')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    processFeedData(data.entries);
                    showContentState();
                    renderFeed();
                } else {
                    throw new Error(data.message || 'Unknown error occurred');
                }
            })
            .catch(err => {
                console.error('Error fetching release notes:', err);
                showErrorState(err.message);
            });
    }

    // Process Raw Feed entries into parsed updates list
    function processFeedData(entries) {
        allUpdates = [];
        let idCounter = 0;
        
        entries.forEach(entry => {
            const parsedSections = parseEntryContent(entry);
            
            parsedSections.forEach(section => {
                idCounter++;
                allUpdates.push({
                    id: `update-${idCounter}`,
                    date: entry.title, // e.g. "July 01, 2026"
                    updatedRaw: entry.updated,
                    link: entry.link || 'https://cloud.google.com/bigquery/docs/release-notes',
                    type: section.type, // Feature, Change, etc.
                    html: section.html,
                    text: section.text,
                    originalTitle: entry.title
                });
            });
        });
        
        // Sort updates by updated date descending
        allUpdates.sort((a, b) => new Date(b.updatedRaw) - new Date(a.updatedRaw));
    }

    // Parse Entry HTML by <h3> headings using DOMParser
    function parseEntryContent(entry) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(entry.content, 'text/html');
        
        const sections = [];
        let currentType = null;
        let currentContentHtml = [];
        
        // Iterate child nodes of body
        Array.from(doc.body.childNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H3') {
                // Save previous section if it has content
                if (currentType && currentContentHtml.length > 0) {
                    sections.push({
                        type: currentType,
                        html: currentContentHtml.join(''),
                        text: stripHtml(currentContentHtml.join(' '))
                    });
                }
                // Start a new section
                currentType = node.textContent.trim();
                currentContentHtml = [];
            } else {
                if (!currentType) {
                    currentType = 'General';
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    currentContentHtml.push(node.outerHTML);
                } else {
                    currentContentHtml.push(node.textContent);
                }
            }
        });
        
        // Push final section
        if (currentType && currentContentHtml.length > 0) {
            sections.push({
                type: currentType,
                html: currentContentHtml.join(''),
                text: stripHtml(currentContentHtml.join(' '))
            });
        }
        
        // Fallback in case of empty or flat feed
        if (sections.length === 0 && entry.content.trim()) {
            sections.push({
                type: 'General',
                html: entry.content,
                text: stripHtml(entry.content)
            });
        }
        
        return sections;
    }

    function stripHtml(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();
    }

    // Render feed
    function renderFeed() {
        feedContent.innerHTML = '';
        
        // Filter the updates
        const filtered = allUpdates.filter(update => {
            const matchesType = activeTypeFilter === 'all' || update.type === activeTypeFilter;
            const matchesSearch = searchQuery === '' || 
                update.type.toLowerCase().includes(searchQuery) ||
                update.date.toLowerCase().includes(searchQuery) ||
                update.text.toLowerCase().includes(searchQuery);
            return matchesType && matchesSearch;
        });

        // Update stats count
        totalCountElem.textContent = filtered.length;

        if (filtered.length === 0) {
            noResults.style.display = 'block';
            feedContent.style.display = 'none';
            return;
        }

        noResults.style.display = 'none';
        feedContent.style.display = 'block';

        // Group updates by date for the timeline UI
        const grouped = {};
        filtered.forEach(update => {
            if (!grouped[update.date]) {
                grouped[update.date] = [];
            }
            grouped[update.date].push(update);
        });

        // Render timeline
        Object.keys(grouped).forEach(date => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'timeline-group';

            // Date marker
            const marker = document.createElement('div');
            marker.className = 'timeline-date-marker';
            marker.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-date-text">${date}</div>
            `;
            groupDiv.appendChild(marker);

            // Container for sub cards
            const updatesDiv = document.createElement('div');
            updatesDiv.className = 'timeline-updates';

            grouped[date].forEach(update => {
                const card = document.createElement('div');
                card.className = `update-card ${selectedUpdateId === update.id ? 'selected' : ''}`;
                card.setAttribute('data-id', update.id);
                card.setAttribute('data-type', update.type);

                card.innerHTML = `
                    <div class="update-card-header">
                        <span class="update-type-badge">${update.type}</span>
                        <div class="update-card-actions">
                            <button class="quick-tweet-btn" title="Tweet this update">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </button>
                            <div class="select-indicator">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="update-card-body">${update.html}</div>
                `;

                // Quick tweet button handler
                const qTweetBtn = card.querySelector('.quick-tweet-btn');
                qTweetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectUpdate(update);
                    // Open Twitter intent directly
                    tweetBtn.click();
                });

                // Main card click - opens in composer panel
                card.addEventListener('click', () => {
                    if (selectedUpdateId === update.id) {
                        deselectAll();
                    } else {
                        selectUpdate(update);
                    }
                });

                updatesDiv.appendChild(card);
            });

            groupDiv.appendChild(updatesDiv);
            feedContent.appendChild(groupDiv);
        });
    }

    // Select an update to compose tweet
    function selectUpdate(update) {
        selectedUpdateId = update.id;
        
        // Highlights selected card
        document.querySelectorAll('.update-card').forEach(c => {
            if (c.getAttribute('data-id') === update.id) {
                c.classList.add('selected');
            } else {
                c.classList.remove('selected');
            }
        });

        // Set up Composer panel UI
        composerEmptyState.style.display = 'none';
        composerActiveState.style.display = 'block';

        // Pre-compose the tweet content
        tweetText.value = precomposeTweet(update);

        // Update preview card title & details
        linkCardTitle.textContent = `BigQuery Release notes: ${update.date}`;
        linkCardDesc.textContent = `Type: ${update.type} | View the full release notes feed for Google Cloud BigQuery.`;
        
        // Focus the composer
        tweetText.focus();
        
        // Update character counts & button state
        updateCharCounter();
    }

    // Deselect current update
    function deselectAll() {
        selectedUpdateId = null;
        document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
        
        composerEmptyState.style.display = 'flex';
        composerActiveState.style.display = 'none';
    }

    // Helper: Formulates a pre-populated tweet under 280 characters
    function precomposeTweet(update) {
        const typeTag = update.type.toUpperCase();
        const dateStr = update.date;
        const link = update.link;
        
        // Templates details
        const prefix = `BigQuery #${typeTag} (${dateStr}): `;
        const suffix = `\n\nRead details: ${link}\n#BigQuery #GCP`;
        
        const maxSnippetLength = 280 - prefix.length - suffix.length;
        
        let snippet = update.text;
        if (snippet.length > maxSnippetLength) {
            // Cut text at word boundary if possible
            let truncated = snippet.substring(0, maxSnippetLength - 4);
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > 100) {
                truncated = truncated.substring(0, lastSpace);
            }
            snippet = `${truncated}...`;
        }

        return `${prefix}${snippet}${suffix}`;
    }

    // Update character counters and Twitter-like progress ring
    function updateCharCounter() {
        const textLength = tweetText.value.length;
        const remaining = 280 - textLength;
        
        charCount.textContent = remaining;

        // Progress percentage for visual ring
        const pct = Math.min(textLength / 280, 1);
        const offset = circumference - (pct * circumference);
        progressRing.style.strokeDashoffset = offset;

        // Color states based on character counts
        if (remaining < 0) {
            charCount.className = 'error';
            progressRing.style.stroke = '#f4212e';
            tweetBtn.disabled = true;
        } else if (remaining <= 20) {
            charCount.className = 'warning';
            progressRing.style.stroke = '#ffd400';
            tweetBtn.disabled = false;
        } else {
            charCount.className = '';
            progressRing.style.stroke = '#1d9bf0';
            tweetBtn.disabled = false;
        }
        
        if (textLength === 0) {
            tweetBtn.disabled = true;
        }
    }

    // UI Loading state managers
    function showLoadingState() {
        refreshBtn.disabled = true;
        refreshSpinner.classList.add('spinning');
        loader.style.display = 'flex';
        errorMessage.style.display = 'none';
        feedContent.style.display = 'none';
        noResults.style.display = 'none';
    }

    function showContentState() {
        refreshBtn.disabled = false;
        refreshSpinner.classList.remove('spinning');
        loader.style.display = 'none';
        errorMessage.style.display = 'none';
        feedContent.style.display = 'block';
    }

    function showErrorState(msg) {
        refreshBtn.disabled = false;
        refreshSpinner.classList.remove('spinning');
        loader.style.display = 'none';
        errorMessage.style.display = 'block';
        errorText.textContent = msg || 'Failed to fetch release notes feed. Please verify your connection.';
        feedContent.style.display = 'none';
        noResults.style.display = 'none';
    }
});
