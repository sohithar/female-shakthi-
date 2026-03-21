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
                { id: 1, title: 'New Government Scheme Available', desc: 'Financial support for women entrepreneurs via Women Entrepreneurship Platform.', time: 'Just now', read: false, url: 'schemes.html' },
                { id: 2, title: 'Scheme Updated – Check Now', desc: 'Updated criteria for Nirbhaya Fund projects.', time: '1 hour ago', read: false, url: 'schemes.html' }
            ];
            this.save();
        }

        this.render();

        this.notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.notifDropdown.classList.toggle('show');
            if (typeof triggerHaptic === 'function') triggerHaptic(20);
        });

        document.addEventListener('click', () => {
             this.notifDropdown.classList.remove('show');
        });

        this.notifDropdown.addEventListener('click', (e) => {
             e.stopPropagation();
        });

        // Simulate a new scheme adding dynamically after 10s if not added yet
        if (!sessionStorage.getItem('onestop_scheme_added')) {
            setTimeout(() => {
                this.simulateNewScheme();
                sessionStorage.setItem('onestop_scheme_added', 'true');
            }, 10000);
        }
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
                item.read = true;
                this.save();
                this.render();
                window.location.href = item.url;
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
            title: 'New Government Scheme Added',
            desc: 'Digital India Initiative for Women Tech Leaders now available for registration.',
            time: 'Just now',
            read: false,
            url: 'schemes.html'
        };
        
        // Push and re-sort dynamically
        this.data.unshift(newNotif);
        if (this.data.length > 10) this.data.pop(); // Keep only last 10
        
        // update older "just now" times
        this.data.forEach((item, index) => {
            if (index > 0 && item.time === 'Just now') {
                item.time = '10 mins ago'; 
            }
        });

        this.save();
        this.render();
        
        if (typeof showToast !== 'undefined') {
            showToast('New Scheme Update Available!', 'info');
        } else if (document.getElementById('toast-container')) {
            // minimal toast fallback
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--primary); color:white; padding:10px 20px; border-radius:30px; z-index:9999; font-size:13px; font-weight:bold; box-shadow:var(--glass-shadow);';
            toast.innerText = 'New Scheme Update Available!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
});
