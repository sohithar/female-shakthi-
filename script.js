/* 
    OneStop - Premium Dynamic SOS JS Integration 
    Author: Enhanced Logic System 
*/

// --- DOM References ---
const sosBtn = document.getElementById('sos-btn');
const statusPanel = document.getElementById('status-panel');
const locationStatus = document.getElementById('location-status');
const themeToggle = document.getElementById('theme-toggle');
const mapContainer = document.getElementById('map-container');
const googleMap = document.getElementById('google-map');
const toastContainer = document.getElementById('toast-container');
const actionBtns = document.querySelectorAll('.action-btn');
const cancelSOSBtn = document.getElementById('cancel-sos-btn');
const holdRing = document.querySelector('.hold-ring');
const holdRingProgress = document.getElementById('hold-ring-progress');

// --- Global State ---
let isDarkTheme = true;
let isSOSActivated = false;
let pressTimer = null;

// --- Cinematic Toast Notification System ---
/**
 * Renders a toast notification
 * @param {string} msg - The message to display
 * @param {string} type - 'info', 'success', 'warning', 'error'
 */
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Choose appropriate icon based on type
    let iconName = 'information-circle';
    if (type === 'success') iconName = 'checkmark-circle';
    if (type === 'warning') iconName = 'warning';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
        <ion-icon name="${iconName}" class="toast-icon"></ion-icon>
        <div class="toast-content">${msg}</div>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove toast
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400); // Wait for exit animation
    }, 3500);
}

// --- Dynamic Theme Toggling ---
themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme', !isDarkTheme);

    const icon = themeToggle.querySelector('ion-icon');
    icon.name = isDarkTheme ? 'moon-outline' : 'sunny-outline';

    // Brief haptic feedback if supported
    triggerHaptic(50);
});

// --- Enhanced SOS Hold-to-Activate ---
const startPress = (e) => {
    if (isSOSActivated) return;

    // Support touch devices to prevent scrolling while pressing
    if (e.type === 'touchstart') e.preventDefault();

    sosBtn.classList.add('active');
    triggerHaptic(50);

    // Show and animate the SVG hold-progress ring
    holdRing.classList.add('visible');
    holdRingProgress.classList.add('filling');

    // Require 900ms hold to activate to prevent accidental triggers
    pressTimer = setTimeout(activateSOS, 900);
};

const cancelPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
    sosBtn.classList.remove('active');
    // Reset hold ring
    holdRing.classList.remove('visible');
    holdRingProgress.classList.remove('filling');
    // Force reflow so animation can restart next time
    void holdRingProgress.offsetWidth;
};

// Bind events for both touch and mouse
sosBtn.addEventListener('mousedown', startPress);
sosBtn.addEventListener('touchstart', startPress, { passive: false });
sosBtn.addEventListener('mouseup', cancelPress);
sosBtn.addEventListener('mouseleave', cancelPress);
sosBtn.addEventListener('touchend', cancelPress);
sosBtn.addEventListener('touchcancel', cancelPress);

// --- Core Verification Layer ---
let countdownTimer = null;
let currentCountdown = 10;
let isVerifying = false;

function activateSOS() {
    if (isSOSActivated || isVerifying) return;
    isVerifying = true;

    // Hide hold ring cleanly
    holdRing.classList.remove('visible');
    holdRingProgress.classList.remove('filling');

    // Show verification panel
    statusPanel.classList.remove('hidden');
    const verificationProg = document.getElementById('verification-progress');
    if (document.getElementById('verification-area')) {
        document.getElementById('verification-area').classList.remove('hidden');
    }
    if (document.getElementById('active-sos-area')) {
        document.getElementById('active-sos-area').classList.add('hidden');
    }

    // Reset countdown
    currentCountdown = 10;
    const countdownNumber = document.getElementById('countdown-number');
    if (countdownNumber) countdownNumber.innerText = currentCountdown;

    // SVG circle animation reset (stroke-dasharray/offset around 283 for r=45)
    if (verificationProg) {
        verificationProg.style.transition = 'none';
        verificationProg.style.strokeDasharray = '282.74';
        verificationProg.style.strokeDashoffset = '0';
        setTimeout(() => {
            verificationProg.style.transition = 'stroke-dashoffset 10s linear';
            verificationProg.style.strokeDashoffset = '282.74';
        }, 50);
    }

    setTimeout(() => {
        statusPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    showToast('Emergency detected. 10 seconds to cancel.', 'warning');
    triggerHaptic([100, 100]);

    countdownTimer = setInterval(() => {
        currentCountdown--;
        if (currentCountdown > 0) {
            if (countdownNumber) countdownNumber.innerText = currentCountdown;
            triggerHaptic(50);
        } else {
            clearInterval(countdownTimer);
            executeSOS();
        }
    }, 1000);
}

function executeSOS() {
    isVerifying = false;
    if (isSOSActivated) return;
    isSOSActivated = true;

    if (document.getElementById('verification-area')) {
        document.getElementById('verification-area').classList.add('hidden');
    }
    if (document.getElementById('active-sos-area')) {
        document.getElementById('active-sos-area').classList.remove('hidden');
    }

    // Body alarm flash
    document.body.classList.add('sos-active');

    // Update aria for screen readers
    sosBtn.setAttribute('aria-pressed', 'true');

    // Strong haptic pattern for critical alert
    triggerHaptic([200, 100, 200, 100, 500]);

    // UI Transformation
    sosBtn.style.background = 'linear-gradient(135deg, #cc0000, #8b0000)';
    sosBtn.style.boxShadow = '0 0 50px rgba(255, 0, 0, 0.6), inset 0 4px 15px rgba(0,0,0,0.5)';
    document.querySelector('.glow-backdrop').style.background = 'radial-gradient(circle, rgba(255, 0, 0, 0.6) 0%, transparent 70%)';
    document.querySelector('.glow-backdrop').style.animationPlayState = 'paused';

    const sosText = document.querySelector('.sos-text');
    sosText.innerText = 'ACTIVE';
    sosText.style.fontSize = '36px';

    showToast('Emergency sequence initiated. Securing GPS data...', 'error');

    // Fetch GPS coordinates leveraging High Accuracy
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0
        });
    } else {
        locationStatus.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 50%; display: flex;">
                <ion-icon name="alert-circle" style="color: var(--danger); font-size: 20px;"></ion-icon>
            </div>
            <span>Geolocation API not supported by this device.</span>
        `;
    }
}

// --- Cancel Emergency ---
function deactivateSOS() {
    if (isVerifying) {
        clearInterval(countdownTimer);
        isVerifying = false;

        // Reset progress ring
        const verificationProg = document.getElementById('verification-progress');
        if (verificationProg) {
            verificationProg.style.transition = 'none';
            verificationProg.style.strokeDashoffset = '0';
        }
        showToast('Emergency countdown cancelled.', 'success');
    } else if (isSOSActivated) {
        showToast('Emergency cancelled. Stay safe!', 'success');
    }

    isSOSActivated = false;

    // Ripple burst animation on button
    const ripple = cancelSOSBtn.querySelector('.cancel-btn-ripple');
    ripple.classList.remove('burst');
    void ripple.offsetWidth; // reflow
    ripple.classList.add('burst');

    // Shake animation for dramatic effect
    cancelSOSBtn.classList.add('shaking');
    setTimeout(() => cancelSOSBtn.classList.remove('shaking'), 600);

    triggerHaptic([100, 50, 100]);

    // Restore SOS button to default state
    sosBtn.removeAttribute('style');
    sosBtn.setAttribute('aria-pressed', 'false');

    const sosText = document.querySelector('.sos-text');
    sosText.innerText = 'SOS';
    sosText.removeAttribute('style');

    // Restore glow backdrop
    const glow = document.querySelector('.glow-backdrop');
    glow.removeAttribute('style');

    // Remove body alarm, hide panel
    document.body.classList.remove('sos-active');

    // Animate panel out before hiding
    statusPanel.style.animation = 'none';
    statusPanel.style.opacity = '0';
    statusPanel.style.transform = 'translateY(20px) scale(0.97)';
    statusPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    setTimeout(() => {
        statusPanel.classList.add('hidden');
        statusPanel.removeAttribute('style');
        if (document.getElementById('verification-area')) {
            document.getElementById('verification-area').classList.remove('hidden');
        }
        if (document.getElementById('active-sos-area')) {
            document.getElementById('active-sos-area').classList.add('hidden');
        }
    }, 420);

    // Reset hold ring state
    void holdRingProgress.offsetWidth;
}

cancelSOSBtn.addEventListener('click', deactivateSOS);

function onLocationSuccess(position) {
    const { latitude: lat, longitude: lon, accuracy } = position.coords;

    const isOnline = navigator.onLine;
    let actionHtml = '';
    const googleMapsLink = `https://maps.google.com/?q=${lat},${lon}`;
    const smsMessage = encodeURIComponent(`🚨 URGENT EMERGENCY 🚨\nI need immediate help!\nMy exact location: ${googleMapsLink}\nAccuracy: ±${Math.round(accuracy)}m`);
    const smsUrl = `sms:112?body=${smsMessage}`;

    if (isOnline) {
        actionHtml = `<a href="${googleMapsLink}" target="_blank" style="color:var(--primary); font-size: 13px; text-decoration:none; font-weight:700; display: flex; align-items: center; gap: 4px;">
            Open in Maps <ion-icon name="open-outline"></ion-icon>
        </a>`;
        showToast(`Location locked (Accuracy: ±${Math.round(accuracy)}m). Alerting authorities...`, 'error');
    } else {
        actionHtml = `<a href="${smsUrl}" style="color:#10b981; font-size: 13px; text-decoration:none; font-weight:700; display: flex; align-items: center; gap: 4px;">
            Send SMS with location <ion-icon name="chatbubble-outline"></ion-icon>
        </a>`;
        showToast('App is offline. Drafted SMS to authorities.', 'warning');
    }

    locationStatus.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 50%; display: flex;">
            <ion-icon name="checkmark-done" style="color: #10b981; font-size: 20px;"></ion-icon>
        </div>
        <div style="display: flex; flex-direction: column;">
            <div style="font-weight: 700; font-size: 15px;">Location Secured</div>
            <div style="font-size: 13px; color: var(--text-muted); margin: 3px 0;">Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}</div>
            ${actionHtml}
        </div>
    `;

    // Automatically trigger the SMS draft so the user just has to hit send!
    setTimeout(() => {
        window.location.href = smsUrl;

        // As a fallback to family contacts, if configured we can also inform them
        const savedFamilyNumber = localStorage.getItem('onestop_family_number');
        if (savedFamilyNumber && !window.location.href.includes('sms')) {
            // Browsers handle multiple redirects poorly without user interaction, but we prioritize 112
        }
    }, 1500);
}

function onLocationError(error) {
    let errorMsg = "Unable to retrieve core coordinates.";
    if (error.code === error.PERMISSION_DENIED) errorMsg = "Location access denied. Please check permissions.";
    if (error.code === error.POSITION_UNAVAILABLE) errorMsg = "Signal strength too weak or unavailable.";
    if (error.code === error.TIMEOUT) errorMsg = "Satellite request timed out.";

    locationStatus.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.2); padding: 10px; border-radius: 50%; display: flex;">
            <ion-icon name="close-circle" style="color: var(--danger); font-size: 20px;"></ion-icon>
        </div>
        <div style="font-weight: 500;">${errorMsg}</div>
    `;

    showToast(errorMsg, 'error');
}

// --- Hardware Motion & Shake Detection Algorithm ---
let lastX = null, lastY = null, lastZ = null;
let lastShakeTimestamp = 0;
const SHAKE_VELOCITY_THRESHOLD = 10; // Lowered to 10 for very high sensitivity on all mobile devices

if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (event) => {
        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        const { x: currX, y: currY, z: currZ } = acceleration;

        if (lastX !== null) {
            const dx = Math.abs(currX - lastX);
            const dy = Math.abs(currY - lastY);
            const dz = Math.abs(currZ - lastZ);

            if ((dx > SHAKE_VELOCITY_THRESHOLD && dy > SHAKE_VELOCITY_THRESHOLD) ||
                (dx > SHAKE_VELOCITY_THRESHOLD && dz > SHAKE_VELOCITY_THRESHOLD) ||
                (dy > SHAKE_VELOCITY_THRESHOLD && dz > SHAKE_VELOCITY_THRESHOLD)) {

                const now = Date.now();
                // 3 second cooldown to prevent multi-fires
                if ((now - lastShakeTimestamp) > 3000) {
                    lastShakeTimestamp = now;
                    if (!isSOSActivated && !isVerifying) {
                        showToast("Turbulence detected! Activating SOS mechanism...", "info");
                        activateSOS();
                    }
                }
            }
        }

        lastX = currX;
        lastY = currY;
        lastZ = currZ;
    });
}

// iOS Safari 13+ strict permission request proxy block
document.body.addEventListener("click", function _requestMotionPermission() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(state => { if (state === 'granted') console.log("Motion API Granted"); })
            .catch(err => console.error("Motion API Declined:", err));
    }
    document.body.removeEventListener("click", _requestMotionPermission);
}, { once: true });

// --- Dynamic Map & Routing Systems ---
actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        triggerHaptic(30);

        if (query) {
            openIframeMap(query);
            showToast(`Generating matrix for "${btn.querySelector('span').innerText}"...`, 'info');
        } else if (btn.id === 'safe-route-btn') {
            openIframeMap("Safe zones, well shaded and lit areas");
            showToast("Calculating safest logistical route...", 'success');
        }
    });
});

function openIframeMap(query) {
    mapContainer.classList.remove('hidden');
    // Using simple maps.google embed structure 
    googleMap.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=14&ie=UTF8&iwloc=&output=embed`;

    setTimeout(() => {
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
}

// --- Dynamic Quick Actions & Phone Dialer Setup ---
const contactCards = document.querySelectorAll('.contact-card:not(#family-contact)');
contactCards.forEach(card => {
    card.addEventListener('click', (e) => {
        triggerHaptic([30, 50]);
        // Note: we don't call e.preventDefault() so the native phone dialer still opens
        showToast(`Connecting to ${card.querySelector('h4').innerText}...`, 'info');
    });
});

// Custom Emergency Contact Setup
const familyContactBtn = document.getElementById('family-contact');
let savedFamilyNumber = localStorage.getItem('onestop_family_number');

// Update UI if number is pre-saved
if (savedFamilyNumber) {
    familyContactBtn.querySelector('span').innerText = 'Call Now';
    familyContactBtn.setAttribute('href', `tel:${savedFamilyNumber}`);
}

familyContactBtn.addEventListener('click', (e) => {
    triggerHaptic(40);

    if (!savedFamilyNumber) {
        e.preventDefault(); // Stop native dialer immediately only if no number is configured
        const input = prompt("Please configure your Emergency Contact number (e.g., 9876543210):");
        if (input && input.trim().length > 3) {
            savedFamilyNumber = input.trim();
            localStorage.setItem('onestop_family_number', savedFamilyNumber);
            familyContactBtn.querySelector('span').innerText = 'Call Now';
            familyContactBtn.setAttribute('href', `tel:${savedFamilyNumber}`);
            showToast('Emergency contact saved internally!', 'success');
        } else {
            showToast('Invalid or no number entered.', 'warning');
        }
    } else {
        // If it's already saved, let the anchor link natively call
        showToast('Dialing Emergency Contact...', 'info');
    }
});

// Allow user to reset the emergency contact by long-pressing
let familyPressTimer;
familyContactBtn.addEventListener('mousedown', () => {
    familyPressTimer = setTimeout(() => {
        if (savedFamilyNumber) {
            triggerHaptic([100, 100]);
            if (confirm("Do you want to reset your Emergency Contact number?")) {
                localStorage.removeItem('onestop_family_number');
                savedFamilyNumber = null;
                familyContactBtn.querySelector('span').innerText = 'Configure';
                showToast("Emergency contact reset.", "info");
            }
        }
    }, 1500); // 1.5 seconds hold to reset
});
familyContactBtn.addEventListener('mouseup', () => clearTimeout(familyPressTimer));
familyContactBtn.addEventListener('mouseleave', () => clearTimeout(familyPressTimer));
familyContactBtn.addEventListener('touchstart', (e) => {
    // passive false allows prevent default conceptually though we handle above
    familyPressTimer = setTimeout(() => {
        if (savedFamilyNumber) {
            triggerHaptic([100, 100]);
            if (confirm("Do you want to reset your Emergency contact number?")) {
                localStorage.removeItem('onestop_family_number');
                savedFamilyNumber = null;
                familyContactBtn.querySelector('span').innerText = 'Configure';
                showToast("Emergency contact reset.", "info");
            }
        }
    }, 1500);
});
familyContactBtn.addEventListener('touchend', () => clearTimeout(familyPressTimer));

// --- Utility Functions ---
function triggerHaptic(pattern) {
    if ("vibrate" in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore if blocked by browser policy without user interaction
            console.warn('Haptics blocked prior to interaction');
        }
    }
}

// --- Offline & PWA Support ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.error('Service Worker Registration Failed!', err));
    });
}

// Watch for internet connection changes
window.addEventListener('offline', () => {
    showToast('You are currently offline. SOS location will use SMS fallback.', 'warning');
});

window.addEventListener('online', () => {
    showToast('Internet connection restored.', 'success');
});

// --- AI Chatbot & Voice Recognition System ---
const chatbotFab = document.getElementById('chatbot-fab');
const chatbotPanel = document.getElementById('chatbot-panel');
const closeChatBtn = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const langSelect = document.getElementById('chat-lang-select');

// Mock AI Brain with multilingual responses
const botDatabase = {
    'en-US': {
        greeting: "Hello! I am your AI Safety Assistant. How can I help you today? Or press the mic to speak.",
        help: "If you need immediate help, please HOLD the main SOS button for 1 second, or tap Quick Actions below.",
        police: "You can find nearby police stations using the Facilities map, or dial 112 directly from Quick Actions.",
        hospital: "To find a nearby hospital, tap the 'Hospitals' button in the Facilities section, or dial 108.",
        complaint: "Initiating Silent E-Complaint. Opening secure SMS directed to National Commission for Women (NCW)...",
        unknown: "I'm a safety assistant. I can help you find hospitals, police, route safe zones, or contact authorities."
    },
    'hi-IN': {
        greeting: "नमस्ते! मैं आपका एआई सुरक्षा सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ? बोलने के लिए माइक दबाएं।",
        help: "यदि आपको तत्काल सहायता की आवश्यकता है, तो कृपया मुख्य SOS बटन को 1 सेकंड के लिए दबाए रखें।",
        police: "आप 112 डायल कर सकते हैं या 'Police Hub' खोज सकते हैं।",
        hospital: "अस्पताल खोजने के लिए 108 डायल करें या मानचित्र का उपयोग करें।",
        complaint: "साइलेंट ई-शिकायत शुरू की जा रही है। NCW को सुरक्षित SMS खोला जा रहा है...",
        unknown: "मैं सुरक्षा संबंधी प्रश्नों में आपकी सहायता कर सकता हूँ (अस्पताल, पुलिस, या मदद)।"
    },
    'te-IN': {
        greeting: "నమస్కారం! నేను మీ AI భద్రతా సహాయకారిని. దయచేసి మాట్లాడటానికి మైక్ నొక్కండి.",
        help: "మీకు తక్షణ సహాయం కావాలంటే, దయచేసి ప్రధాన SOS బటన్‌ను నొక్కి పట్టుకోండి.",
        police: "మీరు 112 కి కాల్ చేయవచ్చు లేదా సమీపంలోని పోలీస్ స్టేషన్లను కనుగొనవచ్చు.",
        hospital: "మీరు ఆసుపత్రికి వెళ్లాలనుకుంటే 108 కి కాల్ చేయండి.",
        complaint: "సైలెంట్ ఇ-ఫిర్యాదు ప్రారంభించబడుతోంది. మహిళా కమిషన్‌కు సురక్షితమైన SMS పంపుతున్నాను...",
        unknown: "దయచేసి ఆసుపత్రి, పోలీస్ లేదా సహాయం గురించి అడగండి."
    },
    'ta-IN': {
        greeting: "வணக்கம்! நான் உங்கள் AI பாதுகாப்பு உதவியாளர். பேச மைக்கை அழுத்தவும்.",
        help: "உங்களுக்கு உதவி தேவைப்பட்டால், முக்கிய SOS பொத்தானை அழுத்தவும்.",
        police: "அருகிலுள்ள காவல் நிலையங்களைக் கண்டறியவோ அல்லது 112 ஐ அழைக்கவோ முடியும்.",
        hospital: "மருத்துவமனைக்கு 108 ஐ தொடர்பு கொள்ளவும்.",
        complaint: "புகார் பதிவு தொடங்குகிறது. பெண்கள் ஆணையத்திற்கு பாதுகாப்பான SMS அனுப்புகிறேன்...",
        unknown: "நான் பாதுகாப்பு தொடர்பான கேள்விகளுக்கு மட்டுமே பதிலளிப்பேன்."
    }
}

// Toggle Chat Interface
chatbotFab.addEventListener('click', () => {
    chatbotPanel.classList.toggle('hidden');
    triggerHaptic(20);
});

closeChatBtn.addEventListener('click', () => {
    chatbotPanel.classList.add('hidden');
    triggerHaptic(20);
});

// Update greeting on lang change
langSelect.addEventListener('change', () => {
    const lang = langSelect.value;
    chatMessages.innerHTML = ''; // Clear chat
    addMessage(botDatabase[lang].greeting, 'bot-msg');
    speakText(botDatabase[lang].greeting, lang);
});

function addMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${className}`;
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Simple rule-based logic for responses
function processUserText(text) {
    const lowerText = text.toLowerCase();
    const lang = langSelect.value;
    const db = botDatabase[lang] || botDatabase['en-US'];

    let response = db.unknown;
    if (lowerText.includes('help') || lowerText.includes('मदद') || lowerText.includes('సహాయం') || lowerText.includes('உதவி') || lowerText.includes('sos') || lowerText.includes('emergency')) {
        response = db.help;
    } else if (lowerText.includes('police') || lowerText.includes('cop') || lowerText.includes('पुलिस') || lowerText.includes('పోలీస్') || lowerText.includes('காவல்')) {
        response = db.police;
    } else if (lowerText.includes('hospital') || lowerText.includes('doctor') || lowerText.includes('अस्पताल') || lowerText.includes('ఆసుపత్రి') || lowerText.includes('மருத்துவமனை')) {
        response = db.hospital;
    } else if (lowerText.includes('complaint') || lowerText.includes('report') || lowerText.includes('शिकायत') || lowerText.includes('ఫిర్యాదు') || lowerText.includes('புகார்')) {
        response = db.complaint;
        // Trigger silent E-Complaint routing
        setTimeout(() => triggerSilentComplaint(), 2500);
    }

    setTimeout(() => {
        addMessage(response, 'bot-msg');
        speakText(response, lang);
    }, 500);
}

// Silent E-Complaint Logic
function triggerSilentComplaint() {
    showToast('Locating secure coordinates for E-Complaint...', 'warning');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Draft an SMS to the National Commission for Women (NCW) helpline or emergency dispatch
            const message = encodeURIComponent(`[URGENT E-COMPLAINT] I am facing an emergency/harassment and need immediate assistance recording a complaint. Location: https://maps.google.com/?q=${lat},${lon}`);
            window.location.href = `sms:1091?body=${message}`;
        }, () => {
            const message = encodeURIComponent(`[URGENT E-COMPLAINT] I am facing an emergency/harassment and need immediate assistance. Status: GPS Unavailable.`);
            window.location.href = `sms:1091?body=${message}`;
        });
    } else {
        const message = encodeURIComponent(`[URGENT E-COMPLAINT] I am facing an emergency/harassment and need immediate assistance. Status: GPS Unavailable.`);
        window.location.href = `sms:1091?body=${message}`;
    }
}

// Quick Prompt Buttons
const promptBtns = document.querySelectorAll('.chat-prompt-btn');
promptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        addMessage(btn.innerText, 'user-msg');
        processUserText(query);
    });
});

// Text interaction
function handleSend() {
    const text = chatInput.value.trim();
    if (text) {
        addMessage(text, 'user-msg');
        processUserText(text);
        chatInput.value = '';
    }
}
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

// Voice Input using Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        micBtn.classList.add('mic-active');
        showToast('Listening...', 'info');
        triggerHaptic(20);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addMessage(transcript, 'user-msg');
        processUserText(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error", event.error);
        if (event.error === 'not-allowed') {
            showToast('Microphone access denied', 'error');
        } else {
            showToast('Could not hear clearly. Try again.', 'warning');
        }
    };

    recognition.onend = () => {
        micBtn.classList.remove('mic-active');
    };
}

micBtn.addEventListener('click', () => {
    if (!SpeechRecognition) {
        showToast('Your browser does not support Voice Recognition', 'error');
        return;
    }

    if (micBtn.classList.contains('mic-active')) {
        recognition.stop();
    } else {
        recognition.lang = langSelect.value;
        try {
            recognition.start();
        } catch (e) { }
    }
});

// Text-to-Speech Engine
function speakText(text, lang) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    }
}
