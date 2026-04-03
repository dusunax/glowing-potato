// Modal popup for editing the logged-in user's nickname.
// Validates that the new nickname is non-empty and not already taken.
import { useState, useEffect, useRef } from 'react';
import { Button, Card } from '@glowing-potato/ui';
const MAX_NICKNAME_LENGTH = 18;
export function UserEditPopup({ currentNickname, onSave, onClose }) {
    const [draft, setDraft] = useState(currentNickname);
    const [status, setStatus] = useState('idle');
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    useEffect(() => {
        setDraft(currentNickname);
    }, [currentNickname]);
    async function handleSave() {
        const trimmed = draft.trim();
        if (!trimmed)
            return;
        if (trimmed === currentNickname) {
            onClose();
            return;
        }
        setStatus('saving');
        const result = await onSave(trimmed);
        if (result === 'success') {
            onClose();
        }
        else {
            setStatus(result);
        }
    }
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-gp-mint font-semibold text-base">Edit Profile</h2>
          <button type="button" onClick={onClose} className="text-gp-mint/70 hover:text-gp-mint text-lg leading-none" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-gp-mint/70">Nickname</label>
          <input type="text" ref={inputRef} value={draft} onChange={(e) => {
            setDraft(e.target.value);
            setStatus('idle');
        }} placeholder="Your nickname" maxLength={MAX_NICKNAME_LENGTH} className="w-full bg-gp-bg border border-gp-accent/40 rounded-lg px-3 py-2 text-sm text-gp-mint placeholder:text-gp-mint/30 focus:outline-none focus:ring-2 focus:ring-gp-mint/40" onKeyDown={(e) => e.key === 'Enter' && handleSave()}/>
          {status === 'error' && (<p className="text-red-400 text-xs">Something went wrong. Please try again.</p>)}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={status === 'saving' || !draft.trim()}>
            {status === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>);
}
