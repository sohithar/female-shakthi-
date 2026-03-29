const NotificationManager = {
    data: [],
    init() {
        this.notifBtn = document.getElementById('notif-btn');
        this.notifDropdown = document.getElementById('notif-dropdown');
        this.notifCount = document.getElementById('notif-count');
        
        if (!this.notifBtn || !this.notifDropdown) return;

        // Ensure we have a list container inside the dropdown
        let notifList = document.getElementById('notif-list');
        if (!notifList) {
            this.notifDropdown.innerHTML = `
                <div class="notif-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--glass-border); margin-bottom: 5px;">
                    <span style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">Notifications</span>
                    <button id="mark-all-read" style="background:none; border:none; color:var(--text-muted); font-size:11px; cursor:pointer; text-decoration:underline;">Mark all as read</button>
                </div>
                <div id="notif-list" style="max-height: 300px; overflow-y: auto;"></div>
            `;
            notifList = document.getElementById('notif-list');
            document.getElementById('mark-all-read').addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });
        }
        this.notifList = notifList;

        // Load data
        const saved = localStorage.getItem('onestop_notifs');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            // Initial Seed Data
            this.data = [
                { id: 1, title: 'Official Scheme Update – Portal', desc: 'New welfare initiatives now available via the National Government Portal.', time: 'Just now', read: false, url: 'https://www.ncw.gov.in/', type: 'SCHEME' },
                { id: 2, title: 'Safety Policy Updated', desc: 'Read the latest protection policies on the official government portal.', time: '2 hours ago', read: false, url: 'https://www.ncw.gov.in/', type: 'POLICY' },
                { id: 3, title: 'New Internship Openings', desc: 'Check the Digital India Internship portal for latest opportunities.', time: 'Yesterday', read: true, url: 'https://dii.nic.in/', type: 'SCHEME' }
            ];
            this.save();
        }

        this.render();

        this.notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.notifDropdown.style.display === 'none' || this.notifDropdown.style.display === '') {
                this.notifDropdown.style.display = 'block';
                this.notifDropdown.classList.add('show');
            } else {
                this.notifDropdown.style.display = 'none';
                this.notifDropdown.classList.remove('show');
            }
            if (typeof triggerHaptic === 'function') triggerHaptic(20);
        });

        document.addEventListener('click', () => {
             this.notifDropdown.style.display = 'none';
             this.notifDropdown.classList.remove('show');
        });

        this.notifDropdown.addEventListener('click', (e) => {
             e.stopPropagation();
        });

        // Simulate a new scheme adding dynamically after 10s
        setTimeout(() => {
            this.simulateNewScheme();
        }, 8000);

        // Simulate a "Danger Zone" alert after 20s to show siren working
        setTimeout(() => {
            this.simulateDangerZone();
        }, 18000);
    },
    
    save() {
        localStorage.setItem('onestop_notifs', JSON.stringify(this.data));
    },

    render() {
        if (!this.notifList) return;
        this.notifList.innerHTML = '';
        let unreadCount = 0;

        this.data.forEach(item => {
            if (!item.read) unreadCount++;
            
            const el = document.createElement('div');
            el.className = `notif-item`;
            if (!item.read) el.style.background = 'rgba(255, 255, 255, 0.08)';
            el.style.cursor = 'pointer';
            el.innerHTML = `
                <div style="font-size: 24px; color: ${item.read ? 'var(--text-muted)' : 'var(--primary)'}; margin-right: 12px; display:flex;">
                    <ion-icon name="notifications"></ion-icon>
                </div>
                <div style="flex: 1; display:flex; flex-direction:column; gap:2px;">
                    <div style="font-weight: 700; font-size: 13px; color: ${item.read ? 'var(--text-muted)' : 'var(--text-main)'};">${item.title}</div>
                    <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">${item.desc}</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px; font-weight: 600;">${item.time}</div>
                </div>
                ${!item.read ? '<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-left:10px;"></div>' : ''}
            `;
            el.addEventListener('click', () => {
                if (item.type === 'DANGER' && typeof window.stopSiren === 'function') {
                    window.stopSiren();
                }
                item.read = true;
                this.save();
                this.render();
                if (item.url) window.open(item.url, '_blank');
            });
            this.notifList.appendChild(el);
        });

        if (this.data.length === 0) {
            this.notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No new notifications</div>';
        }

        if (this.notifCount) {
            if (unreadCount > 0) {
                this.notifCount.style.display = 'flex';
                this.notifCount.innerText = unreadCount;
                // add pulse animation class
                this.notifBtn.style.animation = 'verifyingPulse 1s infinite alternate';
            } else {
                this.notifCount.style.display = 'none';
                this.notifBtn.style.animation = 'none';
            }
        }
    },

    markAllAsRead() {
        this.data.forEach(item => item.read = true);
        this.save();
        this.render();
    },

    simulateNewScheme() {
        const newNotif = {
            id: Date.now(),
            title: 'Scheme Update: Digital Shakti',
            desc: 'New nationwide safety awareness scheme updated. Check eligibility on NCW portal.',
            time: 'Just now',
            read: false,
            url: 'https://www.ncw.gov.in/',
            type: 'SCHEME'
        };
        this.addNotification(newNotif);
    },

    simulateDangerZone() {
        const dangerNotif = {
            id: Date.now(),
            title: '🚨 DANGER ZONE ALERT',
            desc: 'Extreme risk area detected! Siren enabled. Stay safe and contact help immediately.',
            time: 'Just now',
            read: false,
            url: null,
            type: 'DANGER'
        };
        this.addNotification(dangerNotif);
        
        // Trigger the signal/siren as requested
        if (typeof window.startSiren === 'function') {
            window.startSiren();
        }
    },

    addNotification(notif) {
        this.data.unshift(notif);
        if (this.data.length > 8) this.data.pop(); // Keep manageable

        // update older "just now" times
        this.data.forEach((item, index) => {
            if (index > 0 && item.time === 'Just now') {
                item.time = 'Few mins ago'; 
            }
        });

        this.save();
        this.render();
        if (typeof triggerHaptic === 'function') triggerHaptic([100, 50, 100]);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
});
