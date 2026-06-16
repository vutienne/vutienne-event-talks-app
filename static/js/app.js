// ==========================================================================
// APPLICATION STATE
// ==========================================================================
let releaseNotes = [];
let activeFilter = 'all';
let searchQuery = '';

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const feedStatus = document.getElementById('feed-status');
const totalUpdatesCount = document.getElementById('total-updates-count');
const latestReleaseDate = document.getElementById('latest-release-date');
const searchInput = document.getElementById('search-input');
const clearSearch = document.getElementById('clear-search');
const filterPills = document.querySelectorAll('.filter-pill');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const notesList = document.getElementById('notes-list');
const retryBtn = document.getElementById('retry-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const closeModal = document.getElementById('close-modal');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');
const charCounter = document.getElementById('char-counter');
const progressCircle = document.getElementById('progress-ring-circle');
const attachmentSnippet = document.getElementById('attachment-snippet');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Modal Circle Math
const circleRadius = 10;
const circleCircumference = 2 * Math.PI * circleRadius;
if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circleCircumference} ${circleCircumference}`;
    progressCircle.style.strokeDashoffset = circleCircumference;
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Search Handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearch.style.display = searchQuery ? 'flex' : 'none';
        renderFeed();
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearch.style.display = 'none';
        searchInput.focus();
        renderFeed();
    });
    
    // Filter Pills Handler
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.dataset.type;
            renderFeed();
        });
    });
    
    // Modal Event Listeners
    closeModal.addEventListener('click', hideTweetModal);
    cancelTweetBtn.addEventListener('click', hideTweetModal);
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Close modal on click outside
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            hideTweetModal();
        }
    });
});

// ==========================================================================
// DATA FETCHING
// ==========================================================================
async function fetchReleaseNotes() {
    // Show loading UI
    showState('loading');
    refreshBtn.disabled = true;
    refreshIcon.classList.add('fa-spin');
    
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success) {
            releaseNotes = data.entries;
            updateStats();
            renderFeed();
            
            feedStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected';
            feedStatus.className = 'stat-value text-success';
        } else {
            throw new Error(data.error || 'Failed to fetch release notes');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessage.innerText = error.message;
        showState('error');
        
        feedStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Offline';
        feedStatus.className = 'stat-value text-error';
        showToast('Error fetching updates from Google Cloud feed.', true);
    } finally {
        refreshBtn.disabled = false;
        refreshIcon.classList.remove('fa-spin');
    }
}

// ==========================================================================
// STATS UPDATE
// ==========================================================================
function updateStats() {
    let totalCount = 0;
    releaseNotes.forEach(entry => {
        totalCount += entry.items.length;
    });
    
    totalUpdatesCount.innerText = totalCount;
    
    if (releaseNotes.length > 0) {
        latestReleaseDate.innerText = releaseNotes[0].title;
    } else {
        latestReleaseDate.innerText = '-';
    }
}

// ==========================================================================
// RENDER LOGIC
// ==========================================================================
function renderFeed() {
    notesList.innerHTML = '';
    
    let hasMatches = false;
    
    releaseNotes.forEach(entry => {
        // Filter the items within the entry
        const filteredItems = entry.items.filter(item => {
            // Category Filter
            const matchesCategory = activeFilter === 'all' || item.type.toLowerCase() === activeFilter;
            
            // Search Query Filter
            const matchesSearch = !searchQuery || 
                item.text_content.toLowerCase().includes(searchQuery) ||
                item.type.toLowerCase().includes(searchQuery) ||
                entry.title.toLowerCase().includes(searchQuery);
                
            return matchesCategory && matchesSearch;
        });
        
        if (filteredItems.length > 0) {
            hasMatches = true;
            
            // Create Date Group Container
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            // Create Date Header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            
            const dateTitle = document.createElement('h3');
            dateTitle.className = 'date-title';
            dateTitle.innerText = entry.title;
            
            const dateLink = document.createElement('a');
            dateLink.className = 'date-link';
            dateLink.href = entry.link;
            dateLink.target = '_blank';
            dateLink.rel = 'noopener noreferrer';
            dateLink.innerHTML = '<i class="fa-solid fa-link"></i> Docs';
            dateLink.title = 'View original release notes section';
            
            dateHeader.appendChild(dateTitle);
            dateHeader.appendChild(dateLink);
            dateGroup.appendChild(dateHeader);
            
            // Create Updates list
            const updatesList = document.createElement('div');
            updatesList.className = 'date-updates-list';
            
            filteredItems.forEach(item => {
                const card = createUpdateCard(item, entry);
                updatesList.appendChild(card);
            });
            
            dateGroup.appendChild(updatesList);
            notesList.appendChild(dateGroup);
        }
    });
    
    if (releaseNotes.length === 0) {
        showState('error');
    } else if (!hasMatches) {
        showState('empty');
    } else {
        showState('data');
    }
}

function createUpdateCard(item, entry) {
    const card = document.createElement('div');
    const typeClass = item.type.toLowerCase();
    card.className = `update-card ${typeClass}-card`;
    
    // Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'update-card-header';
    
    const badge = document.createElement('span');
    badge.className = `badge ${typeClass}`;
    
    // Get badge icon
    let iconClass = 'fa-solid fa-circle-info';
    if (typeClass === 'feature') iconClass = 'fa-solid fa-wand-magic-sparkles';
    else if (typeClass === 'fix') iconClass = 'fa-solid fa-screwdriver-wrench';
    else if (typeClass === 'issue') iconClass = 'fa-solid fa-triangle-exclamation';
    else if (typeClass === 'deprecation') iconClass = 'fa-solid fa-ban';
    
    badge.innerHTML = `<i class="${iconClass}"></i> ${item.type}`;
    
    const actions = document.createElement('div');
    actions.className = 'update-actions';
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-icon-btn';
    copyBtn.title = 'Copy details to clipboard';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.addEventListener('click', () => copyToClipboard(item.text_content, entry.title, item.type, entry.link));
    
    // Share on X button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-icon-btn share-btn';
    shareBtn.title = 'Share on X (Twitter)';
    shareBtn.innerHTML = '<i class="fa-brands fa-x-twitter"></i>';
    shareBtn.addEventListener('click', () => showTweetModal(item, entry));
    
    actions.appendChild(copyBtn);
    actions.appendChild(shareBtn);
    
    cardHeader.appendChild(badge);
    cardHeader.appendChild(actions);
    
    // Body
    const cardBody = document.createElement('div');
    cardBody.className = 'update-card-body';
    cardBody.innerHTML = item.html_content;
    
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    
    return card;
}

// ==========================================================================
// ACTIONS
// ==========================================================================
function copyToClipboard(textContent, date, type, link) {
    const formattedText = `BigQuery Release Note [${type}] (${date}):\n${textContent}\n\nRead more: ${link}`;
    
    navigator.clipboard.writeText(formattedText)
        .then(() => {
            showToast('Copied release notes to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy text.', true);
        });
}

function showTweetModal(item, entry) {
    // Generate prefilled tweet text
    // Format: 🚀 BigQuery [Feature] (June 15, 2026):
    // Let's construct it, keep within limits
    const maxDescLength = 140; // budget for description
    let cleanDesc = item.text_content;
    if (cleanDesc.length > maxDescLength) {
        cleanDesc = cleanDesc.substring(0, maxDescLength) + '...';
    }
    
    const emojiMap = {
        'feature': '🚀',
        'fix': '🛠️',
        'issue': '⚠️',
        'deprecation': '🚫',
        'general': '📢'
    };
    const emoji = emojiMap[item.type.toLowerCase()] || '📢';
    
    const tweetText = `${emoji} BigQuery [${item.type}] update (${entry.title}):\n"${cleanDesc}"\n\n#BigQuery #GoogleCloud\n${entry.link}`;
    
    // Set text in textarea
    tweetTextarea.value = tweetText;
    
    // Set preview snippet
    attachmentSnippet.innerText = item.text_content.substring(0, 100) + '...';
    
    // Update counter and show modal
    updateCharCount();
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
    tweetTextarea.focus();
    
    // Add event handler for posting
    postTweetBtn.onclick = () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        hideTweetModal();
        showToast('Redirecting to X (Twitter)...');
    };
}

function hideTweetModal() {
    tweetModal.style.display = 'none';
    document.body.style.overflow = ''; // Unlock background scroll
}

function updateCharCount() {
    const length = tweetTextarea.value.length;
    const remaining = 280 - length;
    
    charCounter.innerText = remaining;
    
    // Progress circle offset
    if (progressCircle) {
        const percentage = Math.min(length / 280, 1);
        const offset = circleCircumference - (percentage * circleCircumference);
        progressCircle.style.strokeDashoffset = offset;
        
        // Color changes based on remaining characters
        if (remaining <= 0) {
            progressCircle.style.stroke = '#ef4444'; // Red
            charCounter.style.color = '#ef4444';
            postTweetBtn.disabled = true;
            postTweetBtn.style.opacity = '0.5';
            postTweetBtn.style.pointerEvents = 'none';
        } else if (remaining <= 20) {
            progressCircle.style.stroke = '#f59e0b'; // Amber
            charCounter.style.color = '#f59e0b';
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = '1';
            postTweetBtn.style.pointerEvents = 'auto';
        } else {
            progressCircle.style.stroke = '#1d9bf0'; // Twitter Blue
            charCounter.style.color = 'var(--text-muted)';
            postTweetBtn.disabled = false;
            postTweetBtn.style.opacity = '1';
            postTweetBtn.style.pointerEvents = 'auto';
        }
    }
}

function showToast(message, isError = false) {
    toastMessage.innerText = message;
    if (isError) {
        toast.classList.add('error');
        toast.querySelector('.toast-icon').className = 'fa-solid fa-circle-exclamation toast-icon';
    } else {
        toast.classList.remove('error');
        toast.querySelector('.toast-icon').className = 'fa-solid fa-circle-check toast-icon';
    }
    
    toast.style.display = 'flex';
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.style.display = 'none', 300);
    }, 3000);
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
function resetFilters() {
    searchInput.value = '';
    searchQuery = '';
    clearSearch.style.display = 'none';
    
    filterPills.forEach(p => p.classList.remove('active'));
    filterPills[0].classList.add('active'); // All
    activeFilter = 'all';
    
    renderFeed();
}

function showState(state) {
    loadingState.style.display = state === 'loading' ? 'flex' : 'none';
    errorState.style.display = state === 'error' ? 'flex' : 'none';
    emptyState.style.display = state === 'empty' ? 'flex' : 'none';
    notesList.style.display = state === 'data' ? 'flex' : 'none';
}
