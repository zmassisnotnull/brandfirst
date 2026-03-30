// Card Wallet Service for QRCard.com v1.3
// Manages "Others' Cards" and "Recent Interactions" in localStorage as a fallback for the Invisible Account flow.

export interface WalletContact {
  id: string; // profile_id or local_uuid
  type: 'OWNER' | 'OTHER';
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  profile_image?: string;
  saved_at: number;
  last_contact_at?: number;
  contact_count: number;
}

const WALLET_KEY = 'qrcard_wallet';
const ACTIVITY_LOG_KEY = 'qrcard_activity_log';

export const cardWalletService = {
  // Get all saved contacts
  getWallet(): WalletContact[] {
    const raw = localStorage.getItem(WALLET_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  // Save a profile to the wallet
  saveToWallet(profile: any): WalletContact {
    const wallet = this.getWallet();
    const existingIndex = wallet.findIndex(c => c.id === profile.id);
    
    const newContact: WalletContact = {
      id: profile.id,
      type: 'OTHER',
      name: profile.name,
      title: profile.title,
      company: profile.company,
      phone: profile.phone,
      email: profile.email,
      profile_image: profile.profile_image,
      saved_at: Date.now(),
      contact_count: existingIndex >= 0 ? wallet[existingIndex].contact_count : 0,
      last_contact_at: existingIndex >= 0 ? wallet[existingIndex].last_contact_at : undefined,
    };

    if (existingIndex >= 0) {
      wallet[existingIndex] = newContact;
    } else {
      wallet.push(newContact);
    }

    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    return newContact;
  },

  // Log an interaction (Call, Message, Email)
  logInteraction(profileId: string, action: 'call' | 'message' | 'email') {
    const wallet = this.getWallet();
    const contactIndex = wallet.findIndex(c => c.id === profileId);
    
    if (contactIndex >= 0) {
      wallet[contactIndex].last_contact_at = Date.now();
      wallet[contactIndex].contact_count += 1;
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    }

    // Add to activity log for "Recent Contacts" view
    const activities = this.getActivityLog();
    activities.unshift({
      id: profileId,
      action,
      timestamp: Date.now()
    });
    
    // Keep only last 50
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activities.slice(0, 50)));
  },

  getActivityLog(): any[] {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  // Get Recent Contacts (based on last_contact_at)
  getRecentContacts(limit = 5): WalletContact[] {
    return this.getWallet()
      .filter(c => c.last_contact_at)
      .sort((a, b) => (b.last_contact_at || 0) - (a.last_contact_at || 0))
      .slice(0, limit);
  }
};
