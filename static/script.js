document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Clear response when switching tabs
            clearResponse();
        });
    });
    
    // Form submission handlers
    document.getElementById('quiet-time-btn').addEventListener('click', handleQuietTimeSubmit);
    document.getElementById('books-btn').addEventListener('click', handleBooksSubmit);
    document.getElementById('bible-study-btn').addEventListener('click', handleBibleStudySubmit);
    document.getElementById('question-btn').addEventListener('click', handleQuestionSubmit);
    
    // Copy button functionality
    document.getElementById('copy-btn').addEventListener('click', copyResponseToClipboard);
    
    // Utility Functions
    function showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }
    
    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    function displayResponse(response) {
        const responseContent = document.getElementById('response-content');
        responseContent.innerHTML = formatResponse(response);
        responseContent.scrollIntoView({ behavior: 'smooth' });
    }
    
    function clearResponse() {
        document.getElementById('response-content').innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-pray fa-3x"></i>
                <h3>Welcome to your Church AI Assistant</h3>
                <p>Select a feature above to get started on your spiritual journey.</p>
                <p>I'm here to help with quiet time plans, book recommendations, Bible studies, answering your questions about faith, and now you can keep a personal journal!</p>
            </div>
        `;
    }
    
    function formatResponse(text) {
        // Convert line breaks to HTML
        let formattedText = text.replace(/\n/g, '<br>');
        
        // Format Bible references
        const bibleRefPattern = /([1-3]?)\s*([A-Za-z]+)\s+(\d+):(\d+)(-(\d+))?/g;
        formattedText = formattedText.replace(bibleRefPattern, '<strong>$1 $2 $3:$4$5</strong>');
        
        // Format headers
        formattedText = formattedText.replace(/^(#{1,6})\s+(.+)$/gm, function(match, hashes, content) {
            const level = hashes.length;
            return `<h${level + 2}>${content}</h${level + 2}>`;
        });
        
        // Format lists
        formattedText = formattedText.replace(/^\s*(\d+\.|\*|\-)\s+(.+)$/gm, '<li>$2</li>');
        formattedText = formattedText.replace(/<li>(.+)<\/li>(\s*<li>(.+)<\/li>)+/g, '<ul>$&</ul>');
        
        return formattedText;
    }
    
    async function makeApiRequest(endpoint, data) {
        try {
            showLoading();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const result = await response.json();
            displayResponse(result.result);
        } catch (error) {
            displayResponse(`Error: ${error.message}. Please try again later.`);
            console.error('API request failed:', error);
        } finally {
            hideLoading();
        }
    }
    
    function copyResponseToClipboard() {
        const responseText = document.getElementById('response-content').innerText;
        navigator.clipboard.writeText(responseText)
            .then(() => {
                // Show a brief "Copied!" message
                const copyBtn = document.getElementById('copy-btn');
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyBtn.style.color = '#4caf50';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.color = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    }
    
    // Form Handlers
    function handleQuietTimeSubmit() {
        const duration = document.getElementById('duration').value;
        const focusArea = document.getElementById('focus-area').value;
        
        makeApiRequest('/quiet-time', {
            duration: parseInt(duration) || 15,
            focus_area: focusArea || null
        });
    }
    
    function handleBooksSubmit() {
        const topic = document.getElementById('book-topic').value;
        const spiritualLevel = document.getElementById('spiritual-level').value;
        const count = document.getElementById('book-count').value;
        
        makeApiRequest('/recommend-books', {
            topic: topic || null,
            spiritual_level: spiritualLevel,
            count: parseInt(count) || 3
        });
    }
    
    function handleBibleStudySubmit() {
        const passage = document.getElementById('passage').value;
        
        if (!passage) {
            displayResponse('Please enter a Bible passage to study.');
            return;
        }
        
        makeApiRequest('/bible-study', {
            passage: passage
        });
    }
    
    function handleQuestionSubmit() {
        const question = document.getElementById('question').value;
        
        if (!question) {
            displayResponse('Please enter a question about Christianity.');
            return;
        }
        
        makeApiRequest('/answer-question', {
            question: question
        });
    }

    // Personal Journal functionality
    // Initialize journal entries from localStorage
    let journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    
    // Set today's date as default
    document.getElementById('journal-date').valueAsDate = new Date();
    
    // Mood selector functionality
    const moodOptions = document.querySelectorAll('.mood-option');
    let selectedMood = null;
    
    moodOptions.forEach(option => {
        option.addEventListener('click', () => {
            moodOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedMood = option.getAttribute('data-mood');
        });
    });
    
    // Save journal entry
    document.getElementById('journal-save-btn').addEventListener('click', saveEntry);
    
    function saveEntry() {
        const title = document.getElementById('journal-title').value;
        const date = document.getElementById('journal-date').value;
        const content = document.getElementById('journal-content').value;
        const prayerRequests = document.getElementById('journal-prayer').value;
        const scriptureReference = document.getElementById('journal-scripture').value;
        const tagsInput = document.getElementById('journal-tags').value;
        
        if (!title || !content) {
            alert('Please enter a title and your thoughts');
            return;
        }
        
        if (!selectedMood) {
            alert('Please select how you are feeling today');
            return;
        }
        
        // Process tags
        const tags = tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        // Create new entry
        const newEntry = {
            id: Date.now().toString(),
            title,
            date,
            mood: selectedMood,
            content,
            prayerRequests,
            scriptureReference,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add to journal entries
        journalEntries.unshift(newEntry);
        
        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
        
        // Reset form
        document.getElementById('journal-title').value = '';
        document.getElementById('journal-date').valueAsDate = new Date();
        document.getElementById('journal-content').value = '';
        document.getElementById('journal-prayer').value = '';
        document.getElementById('journal-scripture').value = '';
        document.getElementById('journal-tags').value = '';
        moodOptions.forEach(opt => opt.classList.remove('selected'));
        selectedMood = null;
        
        // Update journal entries list
        renderJournalEntries();
        
        // Show success message
        alert('Journal entry saved successfully!');
    }
    
    // Render journal entries
    function renderJournalEntries() {
        const entriesList = document.getElementById('journal-entries-list');
        const noEntriesMessage = document.getElementById('no-entries-message');
        
        if (journalEntries.length === 0) {
            noEntriesMessage.style.display = 'block';
            entriesList.innerHTML = '';
            return;
        }
        
        noEntriesMessage.style.display = 'none';
        
        // Filter entries based on search and filters
        const searchTerm = document.getElementById('journal-search').value.toLowerCase();
        const moodFilter = document.getElementById('journal-filter-mood').value;
        const dateFilter = document.getElementById('journal-filter-date').value;
        
        let filteredEntries = journalEntries;
        
        // Apply search filter
        if (searchTerm) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.title.toLowerCase().includes(searchTerm) ||
                entry.content.toLowerCase().includes(searchTerm) ||
                entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply mood filter
        if (moodFilter) {
            filteredEntries = filteredEntries.filter(entry => entry.mood === moodFilter);
        }
        
        // Apply date filter
        if (dateFilter) {
            const now = new Date();
            let startDate;
            
            if (dateFilter === 'week') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            } else if (dateFilter === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            } else if (dateFilter === 'year') {
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            }
            
            filteredEntries = filteredEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= startDate;
            });
        }
        
        // Generate HTML for entries
        let entriesHTML = '';
        
        filteredEntries.forEach(entry => {
            const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const moodIcon = getMoodIcon(entry.mood);
            
            let tagsHTML = '';
            if (entry.tags && entry.tags.length > 0) {
                tagsHTML = entry.tags.map(tag => `<span class="journal-tag">${tag}</span>`).join('');
            }
            
            entriesHTML += `
                <div class="journal-entry" data-id="${entry.id}">
                    <div class="journal-entry-header">
                        <div class="journal-entry-title">${entry.title}</div>
                        <div class="journal-entry-date">${formattedDate}</div>
                    </div>
                    <div class="journal-entry-mood">
                        <i class="${moodIcon}"></i> ${capitalizeFirstLetter(entry.mood)}
                    </div>
                    <p>${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}</p>
                    <div class="journal-entry-tags">
                        ${tagsHTML}
                    </div>
                    <div class="journal-actions">
                        <button class="journal-action-btn view-entry" data-id="${entry.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="journal-action-btn edit-entry" data-id="${entry.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="journal-action-btn delete-entry" data-id="${entry.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="journal-action-btn speak-entry" data-id="${entry.id}">
                            <i class="fas fa-volume-up"></i> Listen
                        </button>
                    </div>
                </div>
            `;
        });
        
        entriesList.innerHTML = entriesHTML;
        
        // Add event listeners for entry actions
        document.querySelectorAll('.view-entry').forEach(btn => {
            btn.addEventListener('click', viewEntry);
        });
        
        document.querySelectorAll('.edit-entry').forEach(btn => {
            btn.addEventListener('click', editEntry);
        });
        
        document.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', deleteEntry);
        });
        
        document.querySelectorAll('.speak-entry').forEach(btn => {
            btn.addEventListener('click', speakEntry);
        });
    }
    
    // Helper functions
    function getMoodIcon(mood) {
        const icons = {
            joyful: 'fas fa-smile-beam',
            peaceful: 'fas fa-dove',
            anxious: 'fas fa-wind',
            sad: 'fas fa-cloud-rain',
            confused: 'fas fa-question-circle',
            grateful: 'fas fa-pray'
        };
        
        return icons[mood] || 'fas fa-meh';
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Entry actions
    function viewEntry(e) {
        const entryId = e.currentTarget.getAttribute('data-id');
        const entry = journalEntries.find(entry => entry.id === entryId);
        
        if (!entry) return;
        
        const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const moodIcon = getMoodIcon(entry.mood);
        
        let tagsHTML = '';
        if (entry.tags && entry.tags.length > 0) {
            tagsHTML = entry.tags.map(tag => `<span class="journal-tag">${tag}</span>`).join('');
        }
        
        let scriptureHTML = '';
        if (entry.scriptureReference) {
            scriptureHTML = `
                <div style="margin-top: 20px;">
                    <strong>Scripture Connection:</strong>
                    <p>${entry.scriptureReference}</p>
                </div>
            `;
        }
        
        let prayerHTML = '';
        if (entry.prayerRequests) {
            prayerHTML = `
                <div style="margin-top: 20px;">
                    <strong>Prayer Requests:</strong>
                    <p>${entry.prayerRequests}</p>
                </div>
            `;
        }
        
        displayResponse(`
            <div style="padding: 20px;">
                <h3 style="margin-bottom: 10px; color: var(--primary-color);">${entry.title}</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div>${formattedDate}</div>
                    <div><i class="${moodIcon}"></i> ${capitalizeFirstLetter(entry.mood)}</div>
                </div>
                <div style="white-space: pre-line;">${entry.content}</div>
                ${scriptureHTML}
                ${prayerHTML}
                <div style="margin-top: 20px;">
                    ${tagsHTML}
                </div>
                <div style="margin-top: 30px;">
                    <button class="submit-btn" id="back-to-journal">
                        <i class="fas fa-arrow-left"></i> Back to Journal
                    </button>
                </div>
            </div>
        `);
        
        document.getElementById('back-to-journal').addEventListener('click', () => {
            document.querySelector('[data-tab="journal"]').click();
        });
    }
    
    function editEntry(e) {
        const entryId = e.currentTarget.getAttribute('data-id');
        const entry = journalEntries.find(entry => entry.id === entryId);
        
        if (!entry) return;
        
        // Fill form with entry data
        document.getElementById('journal-title').value = entry.title;
        document.getElementById('journal-date').value = entry.date;
        document.getElementById('journal-content').value = entry.content;
        document.getElementById('journal-prayer').value = entry.prayerRequests || '';
        document.getElementById('journal-scripture').value = entry.scriptureReference || '';
        document.getElementById('journal-tags').value = entry.tags ? entry.tags.join(', ') : '';
        
        // Select mood
        moodOptions.forEach(option => {
            if (option.getAttribute('data-mood') === entry.mood) {
                option.click();
            }
        });
        
        // Change save button to update
        const saveBtn = document.getElementById('journal-save-btn');
        saveBtn.innerHTML = 'Update Entry';
        saveBtn.setAttribute('data-edit-id', entryId);
        
        // Scroll to form
        document.getElementById('journal-form').scrollIntoView({ behavior: 'smooth' });
        
        // Change save button behavior
        saveBtn.removeEventListener('click', saveEntry);
        saveBtn.addEventListener('click', updateEntry);
    }
    
    function updateEntry() {
        const saveBtn = document.getElementById('journal-save-btn');
        const entryId = saveBtn.getAttribute('data-edit-id');
        
        if (!entryId) return;
        
        const title = document.getElementById('journal-title').value;
        const date = document.getElementById('journal-date').value;
        const content = document.getElementById('journal-content').value;
        const prayerRequests = document.getElementById('journal-prayer').value;
        const scriptureReference = document.getElementById('journal-scripture').value;
        const tagsInput = document.getElementById('journal-tags').value;
        
        if (!title || !content) {
            alert('Please enter a title and your thoughts');
            return;
        }
        
        if (!selectedMood) {
            alert('Please select how you are feeling today');
            return;
        }
        
        // Process tags
        const tags = tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        // Find entry index
        const entryIndex = journalEntries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex === -1) return;
        
        // Update entry
        journalEntries[entryIndex] = {
            ...journalEntries[entryIndex],
            title,
            date,
            mood: selectedMood,
            content,
            prayerRequests,
            scriptureReference,
            tags,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
        
        // Reset form
        document.getElementById('journal-title').value = '';
        document.getElementById('journal-date').valueAsDate = new Date();
        document.getElementById('journal-content').value = '';
        document.getElementById('journal-prayer').value = '';
        document.getElementById('journal-scripture').value = '';
        document.getElementById('journal-tags').value = '';
        moodOptions.forEach(opt => opt.classList.remove('selected'));
        selectedMood = null;
        
        // Reset save button
        saveBtn.innerHTML = 'Save Entry';
        saveBtn.removeAttribute('data-edit-id');
        
        // Remove update event listener and add save event listener
        saveBtn.removeEventListener('click', updateEntry);
        saveBtn.addEventListener('click', saveEntry);
        
        // Update journal entries list
        renderJournalEntries();
        
        // Show success message
        alert('Journal entry updated successfully!');
    }
    
    function deleteEntry(e) {
        const entryId = e.currentTarget.getAttribute('data-id');
        
        if (confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
            // Remove entry from array
            journalEntries = journalEntries.filter(entry => entry.id !== entryId);
            
            // Save to localStorage
            localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
            
            // Update journal entries list
            renderJournalEntries();
            
            // Show success message
            alert('Journal entry deleted successfully!');
        }
    }
    
    // Initialize journal entries list
    renderJournalEntries();
    
    // Add event listeners for filters
    document.getElementById('journal-search').addEventListener('input', renderJournalEntries);
    document.getElementById('journal-filter-mood').addEventListener('change', renderJournalEntries);
    document.getElementById('journal-filter-date').addEventListener('change', renderJournalEntries);

    // Voice Recognition Functionality
    let recognition;
    let isRecognizing = false;
    let currentVoiceInput = null;
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;
    
    if (SpeechRecognition) {
        // Initialize speech recognition
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Handle recognition results
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update the current input field
            if (currentVoiceInput) {
                if (currentVoiceInput.tagName === 'TEXTAREA') {
                    // For textarea, append the text
                    currentVoiceInput.value += finalTranscript + ' ';
                    
                    // Update transcript display if it's the journal content
                    if (currentVoiceInput.id === 'journal-content') {
                        const transcriptEl = document.getElementById('journal-transcript');
                        transcriptEl.textContent = interimTranscript;
                        transcriptEl.classList.add('active');
                    }
                } else {
                    // For input fields, replace the text
                    currentVoiceInput.value = finalTranscript;
                }
            }
        };
        
        // Handle recognition end
        recognition.onend = () => {
            isRecognizing = false;
            
            // Reset voice buttons
            document.querySelectorAll('.voice-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Hide voice controls
            document.getElementById('journal-voice-pause').style.display = 'none';
            document.getElementById('journal-voice-stop').style.display = 'none';
            
            // Update status
            const statusEl = document.getElementById('journal-voice-status');
            if (statusEl) {
                statusEl.textContent = 'Click the microphone to start speaking';
            }
            
            // Hide transcript
            const transcriptEl = document.getElementById('journal-transcript');
            if (transcriptEl) {
                transcriptEl.classList.remove('active');
            }
        };
        
        // Handle recognition errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            
            // Update status
            const statusEl = document.getElementById('journal-voice-status');
            if (statusEl) {
                statusEl.textContent = `Error: ${event.error}. Please try again.`;
            }
            
            // Reset voice buttons
            document.querySelectorAll('.voice-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            isRecognizing = false;
        };
        
        // Add event listeners to voice buttons
        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get the input field associated with this button
                const inputId = btn.id.replace('-voice', '');
                currentVoiceInput = document.getElementById(inputId);
                
                if (!currentVoiceInput) return;
                
                if (isRecognizing) {
                    // Stop recognition if already running
                    recognition.stop();
                    isRecognizing = false;
                    btn.classList.remove('active');
                    
                    // Hide voice controls
                    document.getElementById('journal-voice-pause').style.display = 'none';
                    document.getElementById('journal-voice-stop').style.display = 'none';
                    
                    // Update status
                    const statusEl = document.getElementById('journal-voice-status');
                    if (statusEl) {
                        statusEl.textContent = 'Click the microphone to start speaking';
                    }
                } else {
                    // Start recognition
                    try {
                        recognition.start();
                        isRecognizing = true;
                        btn.classList.add('active');
                        
                        // Show voice controls for journal content
                        if (inputId === 'journal-content') {
                            document.getElementById('journal-voice-pause').style.display = 'inline-flex';
                            document.getElementById('journal-voice-stop').style.display = 'inline-flex';
                            
                            // Update status
                            const statusEl = document.getElementById('journal-voice-status');
                            if (statusEl) {
                                statusEl.textContent = 'Listening... Speak now';
                            }
                            
                            // Show transcript
                            const transcriptEl = document.getElementById('journal-transcript');
                            if (transcriptEl) {
                                transcriptEl.classList.add('active');
                            }
                        }
                    } catch (error) {
                        console.error('Speech recognition error', error);
                    }
                }
            });
        });
        
        // Add event listeners for voice controls
        document.getElementById('journal-voice-pause').addEventListener('click', () => {
            if (isRecognizing) {
                recognition.stop();
                isRecognizing = false;
                
                // Update button text
                document.getElementById('journal-voice-pause').innerHTML = '<i class="fas fa-play"></i> Resume';
                
                // Update status
                const statusEl = document.getElementById('journal-voice-status');
                if (statusEl) {
                    statusEl.textContent = 'Paused. Click Resume to continue.';
                }
            } else {
                try {
                    recognition.start();
                    isRecognizing = true;
                    
                    // Update button text
                    document.getElementById('journal-voice-pause').innerHTML = '<i class="fas fa-pause"></i> Pause';
                    
                    // Update status
                    const statusEl = document.getElementById('journal-voice-status');
                    if (statusEl) {
                        statusEl.textContent = 'Listening... Speak now';
                    }
                } catch (error) {
                    console.error('Speech recognition error', error);
                }
            }
        });
        
        document.getElementById('journal-voice-stop').addEventListener('click', () => {
            if (isRecognizing) {
                recognition.stop();
                isRecognizing = false;
                
                // Reset voice buttons
                document.querySelectorAll('.voice-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Hide voice controls
                document.getElementById('journal-voice-pause').style.display = 'none';
                document.getElementById('journal-voice-stop').style.display = 'none';
                
                // Update status
                const statusEl = document.getElementById('journal-voice-status');
                if (statusEl) {
                    statusEl.textContent = 'Click the microphone to start speaking';
                }
                
                // Hide transcript
                const transcriptEl = document.getElementById('journal-transcript');
                if (transcriptEl) {
                    transcriptEl.classList.remove('active');
                }
            }
        });
    } else {
        // Hide voice buttons if speech recognition is not supported
        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Hide voice controls
        document.getElementById('journal-voice-pause').style.display = 'none';
        document.getElementById('journal-voice-stop').style.display = 'none';
        
        // Update status
        const statusEl = document.getElementById('journal-voice-status');
        if (statusEl) {
            statusEl.textContent = 'Voice input is not supported in your browser.';
        }
    }

    // Text-to-Speech Functionality
    let speechSynthesis = window.speechSynthesis;
    let currentUtterance = null;
    let isSpeaking = false;
    
    // Function to speak text
    function speakText(text) {
        if (!speechSynthesis) return;
        
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language
        utterance.lang = 'en-US';
        
        // Set voice (optional)
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google'));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        // Set properties
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Store current utterance
        currentUtterance = utterance;
        isSpeaking = true;
        
        // Update speak button
        const speakBtn = document.getElementById('speak-response-btn');
        speakBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        // Handle speech end
        utterance.onend = () => {
            isSpeaking = false;
            currentUtterance = null;
            
            // Update speak button
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        };
        
        // Speak the text
        speechSynthesis.speak(utterance);
    }
    
    // Function to pause/resume speech
    function toggleSpeech() {
        if (!speechSynthesis) return;
        
        if (isSpeaking) {
            // Pause speech
            speechSynthesis.pause();
            isSpeaking = false;
            
            // Update speak button
            document.getElementById('speak-response-btn').innerHTML = '<i class="fas fa-play"></i>';
        } else {
            // Resume speech
            speechSynthesis.resume();
            isSpeaking = true;
            
            // Update speak button
            document.getElementById('speak-response-btn').innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    // Function to stop speech
    function stopSpeech() {
        if (!speechSynthesis) return;
        
        // Cancel speech
        speechSynthesis.cancel();
        isSpeaking = false;
        currentUtterance = null;
        
        // Update speak button
        document.getElementById('speak-response-btn').innerHTML = '<i class="fas fa-volume-up"></i>';
    }
    
    // Add event listener to speak button
    document.getElementById('speak-response-btn').addEventListener('click', () => {
        if (isSpeaking) {
            toggleSpeech();
        } else {
            // Get text to speak
            const responseText = document.getElementById('response-content').textContent;
            speakText(responseText);
        }
    });
    
    // Function to speak journal entry
    function speakEntry(e) {
        const entryId = e.currentTarget.getAttribute('data-id');
        const entry = journalEntries.find(entry => entry.id === entryId);
        
        if (!entry) return;
        
        // Create text to speak
        let textToSpeak = `Journal entry: ${entry.title}. `;
        textToSpeak += `Date: ${new Date(entry.date).toLocaleDateString()}. `;
        textToSpeak += `Mood: ${entry.mood}. `;
        textToSpeak += `${entry.content}`;
        
        if (entry.scriptureReference) {
            textToSpeak += ` Scripture connection: ${entry.scriptureReference}.`;
        }
        
        if (entry.prayerRequests) {
            textToSpeak += ` Prayer requests: ${entry.prayerRequests}.`;
        }
        
        // Speak the text
        speakText(textToSpeak);
    }
    
    // Initialize voices when they are available
    speechSynthesis.onvoiceschanged = () => {
        // This event fires when voices are available
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
    };
    
    // Make sure voices are loaded
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.getVoices();
    }
});
