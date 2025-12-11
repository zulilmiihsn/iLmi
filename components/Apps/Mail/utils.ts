import { Email, Mailbox } from './types';

export const STORAGE_KEY = 'ilmi_mail_data_v1';

export const SEED_EMAILS: Email[] = [
    {
        id: '1',
        from: 'Jackelyn Perra',
        subject: 'Fun memories',
        preview:
            "Hi, Ashley found this photo from back in 2018. Can you believe it's been years? Let's start planning our reunion!",
        date: '9/14/21',
        read: true,
        mailbox: 'inbox',
        isVip: true,
    },
    {
        id: '2',
        from: 'Erin Levin',
        subject: 'Family reunion',
        preview:
            'Hello everyone, I was thinking we should plan a family reunion for next summer. What do you think about the beach?',
        date: '9/14/21',
        read: true,
        mailbox: 'inbox',
        isFlagged: true,
    },
    {
        id: '3',
        from: 'Best Buy',
        subject: 'Order confirmed',
        preview: 'Thanks for your order! Your item(s) will be shipped soon. Track your package here.',
        date: '9/13/21',
        read: false,
        mailbox: 'inbox',
    },
    {
        id: '4',
        from: 'Netflix',
        subject: 'New arrivals',
        preview:
            'Check out the latest movies and TV shows added to Netflix this week. There is something for everyone!',
        date: '9/12/21',
        read: true,
        mailbox: 'inbox',
    },
    {
        id: '5',
        from: 'Apple',
        subject: 'Your receipt',
        preview: 'Receipt for your recent purchase from the App Store. Total: $0.99',
        date: '9/11/21',
        read: true,
        mailbox: 'inbox',
    },
    {
        id: '6',
        from: 'John Doe',
        subject: 'The best vacation',
        preview:
            'Just wanted to say thanks for organizing the trip. It was absolutely the best vacation ever!',
        date: '9/10/21',
        read: true,
        mailbox: 'inbox',
    },
];

export const MOCK_MAILBOXES_STATIC: Mailbox[] = [
    { id: 'all_inboxes', name: 'All Inboxes', icon: 'fa-layer-group', type: 'smart' },
    { id: 'icloud', name: 'iCloud', icon: 'fa-cloud', type: 'account' },
    { id: 'gmail', name: 'Gmail', icon: 'fa-google', type: 'account' },
    { id: 'yahoo', name: 'Yahoo!', icon: 'fa-yahoo', type: 'account' },
    { id: 'vip', name: 'VIP', icon: 'fa-star', type: 'smart' },
    { id: 'flagged', name: 'Flagged', icon: 'fa-flag', type: 'smart' },
    { id: 'drafts', name: 'Drafts', icon: 'fa-file-alt', type: 'folder' },
    { id: 'sent', name: 'Sent', icon: 'fa-paper-plane', type: 'folder' },
    { id: 'junk', name: 'Junk', icon: 'fa-times-circle', type: 'folder' },
    { id: 'trash', name: 'Trash', icon: 'fa-trash-alt', type: 'folder' },
    { id: 'archive', name: 'Archive', icon: 'fa-archive', type: 'folder' },
];

export const ACCOUNT_FOLDERS: Mailbox[] = [
    { id: 'inbox', name: 'Inbox', icon: 'fa-inbox', type: 'folder' },
    { id: 'drafts', name: 'Drafts', icon: 'fa-file', type: 'folder' },
    { id: 'sent', name: 'Sent', icon: 'fa-paper-plane', type: 'folder' },
    { id: 'junk', name: 'Junk', icon: 'fa-times-circle', type: 'folder' },
    { id: 'trash', name: 'Trash', icon: 'fa-trash-alt', type: 'folder' },
    { id: 'archive', name: 'Archive', icon: 'fa-archive', type: 'folder' },
];

export const loadEmails = (): Email[] => {
    if (typeof window === 'undefined') return SEED_EMAILS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : SEED_EMAILS;
    } catch (e) {
        console.error('Failed to load emails', e);
        return SEED_EMAILS;
    }
};

export const saveEmails = (emails: Email[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
    } catch (e) {
        console.error('Failed to save emails', e);
    }
};
