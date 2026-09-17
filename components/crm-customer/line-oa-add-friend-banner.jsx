'use client';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LineOaAddFriendBanner({ addFriendUrl, oaName, className = '' }) {
  if (!addFriendUrl) return null;

  const label = (oaName || '').trim() || 'Official Account';

  const openAddFriend = () => {
    if (typeof window === 'undefined') return;
    if (window.liff?.openWindow) {
      window.liff.openWindow({ url: addFriendUrl, external: false });
      return;
    }
    window.location.href = addFriendUrl;
  };

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-3 ${className}`}
    >
      <p className="text-xs leading-relaxed">
        เพิ่มเพื่อน LINE OA 「{label}」 เพื่อรับข้อความและโปรโมชันจากร้าน (จำเป็นสำหรับบรอดแคสต์)
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10"
        onClick={openAddFriend}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        เพิ่มเพื่อน {label}
      </Button>
    </div>
  );
}
