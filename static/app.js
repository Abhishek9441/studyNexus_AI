// Global variables
let currentFileId = null;
let currentFileName = "";
let currentQuiz = null;
let userId = 'user_' + Math.random().toString(36).substr(2, 9);

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const questionInput = document.getElementById('questionInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const genQuizBtn = document.getElementById('genQuizBtn');

// ========== FILE UPLOAD ==========
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#6366f1';
    dropZone.style.background = 'rgba(99, 102, 241, 0.1)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

async function handleFile(file) {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.html', '.htm'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
        alert('⚠️ Only PDF, JPG, PNG, TXT, HTML files allowed!');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        alert('⚠️ File too large! Max 50MB.');
        return;
    }

    showLoading('Uploading file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload-file', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.error) {
            hideLoading();
            alert('❌ ' + data.error);
            return;
        }

        currentFileId = data.file_id;
        currentFileName = file.name;
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        dropZone.style.display = 'none';

        questionInput.disabled = false;
        sendBtn.disabled = false;
        genQuizBtn.disabled = false;

        addMessage('ai', `✅ **${file.name}** uploaded!\n\n📝 ${data.total_chars} characters extracted\n\nAsk me anything about it!`);

        updateStats();
    } catch (error) {
        hideLoading();
        alert('❌ Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ========== CHAT FUNCTIONS ==========
function addMessage(sender, text) {
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const div = document.createElement('div');
    div.className = `message ${sender}`;

    if (sender === 'ai') {
        div.innerHTML = `
            <div class="msg-header"><i class="fas fa-robot"></i> StudyNexus AI</div>
            <div class="msg-text">${formatText(text)}</div>
        `;
    } else {
        div.innerHTML = `<div class="msg-text">${escapeHtml(text)}</div>`;
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatText(text) {
    text = escapeHtml(text);
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.2);padding:2px 6px;border-radius:4px;">$1</code>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendQuestion() {
    const question = questionInput.value.trim();
    if (!question || !currentFileId) return;

    addMessage('user', question);
    questionInput.value = '';
    showLoading('AI is thinking...');

    try {
        const formData = new FormData();
        formData.append('file_id', currentFileId);
        formData.append('file_name', currentFileName);
        formData.append('question', question);
        formData.append('user_id', userId);

        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.error) {
            addMessage('ai', '❌ ' + data.error);
        } else {
            addMessage('ai', data.answer);
            updateStats();
        }
    } catch (error) {
        addMessage('ai', '❌ Error. Please try again.');
    } finally {
        hideLoading();
    }
}

questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendQuestion();
});

// ========== VOICE INPUT ==========
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('❌ Voice input not supported in this browser. Use Chrome!');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    const voiceBtn = document.querySelector('.voice-btn');
    voiceBtn.classList.add('recording');

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        questionInput.value = transcript;
        voiceBtn.classList.remove('recording');
    };

    recognition.onerror = () => {
        voiceBtn.classList.remove('recording');
        alert('❌ Voice recognition failed. Try again.');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
    };

    recognition.start();
}

// ========== TAB SWITCHING ==========
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    const clickedBtn = event.target.closest('.nav-item');
    if (clickedBtn) clickedBtn.classList.add('active');

    document.getElementById(tab + 'Tab').classList.add('active');

    const titles = {
        chat: 'Chat with your file',
        quiz: 'AI Quiz Generator',
        progress: 'Learning Dashboard',
        history: 'Conversation History'
    };
    document.getElementById('pageTitle').textContent = titles[tab];

    if (tab === 'history') loadHistory();
    if (tab === 'progress') loadProgress();
}

// ========== QUIZ FUNCTIONS ==========
async function generateQuiz() {
    if (!currentFileId) {
        alert('⚠️ Upload a file first!');
        return;
    }

    const numQuestions = parseInt(document.getElementById('quizCountInput').value);
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 100) {
        alert('⚠️ Enter a number between 1 and 100');
        return;
    }

    showLoading(`Generating ${numQuestions} questions...`);

    try {
        const formData = new FormData();
        formData.append('file_id', currentFileId);
        formData.append('num_questions', numQuestions);

        const response = await fetch('/generate-quiz', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.error) {
            hideLoading();
            alert('❌ ' + data.error);
            return;
        }

        currentQuiz = parseQuiz(data.quiz);

        if (currentQuiz.length === 0) {
            hideLoading();
            alert('❌ Could not parse quiz. Try again.');
            return;
        }

        displayQuiz(currentQuiz);

        document.getElementById('quizSetup').style.display = 'none';
        document.getElementById('quizContent').style.display = 'block';
        document.getElementById('quizResult').style.display = 'none';
    } catch (error) {
        hideLoading();
        alert('❌ Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

function parseQuiz(text) {
    const questions = [];
    const blocks = text.split(/(?=Q:)/).filter(b => b.trim().startsWith('Q:'));

    blocks.forEach(block => {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 6) return;

        const qText = lines[0].replace('Q:', '').trim();
        const options = {};
        let correct = '';

        lines.forEach(line => {
            const optMatch = line.match(/^([A-D])\)\s*(.+)$/);
            if (optMatch) options[optMatch[1]] = optMatch[2].trim();

            const correctMatch = line.match(/^Correct:\s*([A-D])$/i);
            if (correctMatch) correct = correctMatch[1].toUpperCase();
        });

        if (qText && Object.keys(options).length >= 2 && correct) {
            questions.push({ question: qText, options, correct });
        }
    });

    return questions;
}

function displayQuiz(questions) {
    const container = document.getElementById('quizQuestions');
    container.innerHTML = '';

    questions.forEach((q, idx) => {
        const block = document.createElement('div');
        block.className = 'question-block';

        let optionsHtml = '';
        Object.entries(q.options).forEach(([key, val]) => {
            optionsHtml += `
                <label class="option" onclick="selectOption(this, ${idx}, '${key}')">
                    <input type="radio" name="q${idx}" value="${key}">
                    <span><strong>${key})</strong> ${escapeHtml(val)}</span>
                </label>
            `;
        });

        block.innerHTML = `
            <h4>Question ${idx + 1}</h4>
            <div class="q-text">${escapeHtml(q.question)}</div>
            <div class="options">${optionsHtml}</div>
        `;

        container.appendChild(block);
    });
}

function selectOption(el, qIdx, val) {
    document.querySelectorAll(`[name="q${qIdx}"]`).forEach(opt => {
        opt.closest('.option').classList.remove('selected');
    });
    el.classList.add('selected');
    el.querySelector('input').checked = true;
}

async function submitQuiz() {
    if (!currentQuiz || currentQuiz.length === 0) return;

    let score = 0;
    currentQuiz.forEach((q, idx) => {
        const selected = document.querySelector(`[name="q${idx}"]:checked`);
        const options = document.querySelectorAll(`[name="q${idx}"]`);

        options.forEach(opt => {
            const optionEl = opt.closest('.option');
            if (opt.value === q.correct) optionEl.classList.add('correct');
            else if (opt.checked && opt.value !== q.correct) optionEl.classList.add('wrong');
        });

        if (selected && selected.value === q.correct) score++;
    });

    const total = currentQuiz.length;

    try {
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('file_id', currentFileId);
        formData.append('score', score);
        formData.append('total', total);

        await fetch('/submit-quiz', {
            method: 'POST',
            body: formData
        });
    } catch (e) {
        console.log('Could not save quiz');
    }

    setTimeout(() => {
        document.getElementById('quizContent').style.display = 'none';
        document.getElementById('quizResult').style.display = 'flex';
        document.getElementById('scoreValue').textContent = `${score}/${total}`;

        const percentage = (score / total) * 100;
        let message = '';
        if (percentage >= 80) message = '🏆 Excellent! You nailed it!';
        else if (percentage >= 60) message = '🌟 Great job! Keep it up!';
        else if (percentage >= 40) message = '💪 Good effort! Practice more!';
        else message = '📚 Keep practicing! You\'ll get there!';

        document.getElementById('scoreMessage').textContent = message;
        updateStats();
    }, 2000);
}

function resetQuiz() {
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizSetup').style.display = 'block';
    currentQuiz = null;
}

function shareQuiz() {
    const text = `I just took a quiz on StudyNexus AI! Can you beat my score? Try it at http://localhost:8000`;
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Quiz link copied to clipboard!');
    }).catch(() => {
        alert('❌ Could not copy link');
    });
}

function shareResult() {
    const scoreText = document.getElementById('scoreValue').textContent;
    const text = `I scored ${scoreText} on StudyNexus AI quiz! Can you beat me? 🎯`;
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Result copied! Share with friends!');
    }).catch(() => {
        alert('❌ Could not copy');
    });
}

// ========== PROGRESS & HISTORY ==========
async function loadProgress() {
    try {
        const response = await fetch(`/progress/${userId}`);
        const data = await response.json();

        if (data.error) return;

        document.getElementById('progressFiles').textContent = data.pdfs_uploaded;
        document.getElementById('progressQuestions').textContent = data.questions_asked;
        document.getElementById('progressQuizzes').textContent = data.quizzes_taken;
        document.getElementById('progressScore').textContent = data.total_score;
    } catch (e) {
        console.log('Progress load failed');
    }
}

async function loadHistory() {
    try {
        const response = await fetch(`/history/${userId}`);
        const data = await response.json();

        const container = document.getElementById('historyList');

        if (data.error) {
            container.innerHTML = `<p class="empty-state">❌ ${data.error}</p>`;
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-state">No conversations yet. Start chatting!</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="history-item">
                <div class="q">📄 ${escapeHtml(item.file_name || 'File')} | Q: ${escapeHtml(item.question)}</div>
                <div class="a">${formatText(item.answer)}</div>
                <div class="time"><i class="far fa-clock"></i> ${item.timestamp}</div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('historyList').innerHTML = 
            '<p class="empty-state">❌ Could not load history.</p>';
    }
}

async function updateStats() {
    try {
        const response = await fetch(`/progress/${userId}`);
        const data = await response.json();

        if (data.error) return;

        document.getElementById('pdfCount').textContent = data.pdfs_uploaded;
        document.getElementById('qCount').textContent = data.questions_asked;
        document.getElementById('quizCount').textContent = data.quizzes_taken;
        document.getElementById('scoreCount').textContent = data.total_score;
    } catch (e) {
        console.log('Stats update failed');
    }
}

// ========== THEME TOGGLE ==========
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');

    if (html.getAttribute('data-theme') === 'light') {
        html.removeAttribute('data-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    } else {
        html.setAttribute('data-theme', 'light');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'fas fa-sun';
}

// ========== UTILITIES ==========
function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ StudyNexus AI loaded!');
    updateStats();
});
