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
                <p>I'm here to help with quiet time plans, book recommendations, Bible studies, and answering your questions about faith.</p>
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
});