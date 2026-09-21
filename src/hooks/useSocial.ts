import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ContactRequest, LastSeenVisibility, Profile } from '../types';

export type Relation =
  | { kind: 'self' }
  | { kind: 'contact' }
  | { kind: 'incoming'; request: ContactRequest }
  | { kind: 'outgoing'; request: ContactRequest }
  | { kind: 'blocked' }
  | { kind: 'none' };

function normalizeVisibility(value: LastSeenVisibility | undefined): LastSeenVisibility {
  return value === 'contacts' || value === 'nobody' ? value : 'everyone';
}

export function canSeePresence(
  viewerId: string | undefined,
  peer: Profile | null | undefined,
  isContact: boolean
): boolean {
  if (!viewerId || !peer || peer.id === viewerId) return true;
  const visibility = normalizeVisibility(peer.last_seen_visibility);
  if (visibility === 'nobody') return false;
  if (visibility === 'contacts') return isContact;
  return true;
}

export function useSocial(currentUserId: string | undefined) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [requestProfiles, setRequestProfiles] = useState<Map<string, Profile>>(new Map());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!currentUserId) return;
    const [{ data: requestRows }, { data: blockRows }, { data: muteRows }] = await Promise.all([
      supabase
        .from('contact_requests')
        .select('*')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`),
      supabase.from('blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
      supabase.from('conversation_mutes').select('peer_id').eq('user_id', currentUserId),
    ]);

    setRequests((requestRows || []) as ContactRequest[]);
    const counterpartIds = Array.from(
      new Set(
        ((requestRows || []) as ContactRequest[])
          .flatMap((req) => [req.requester_id, req.addressee_id])
          .filter((id) => id !== currentUserId)
      )
    );
    if (counterpartIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', counterpartIds);
      setRequestProfiles(new Map(((profiles || []) as Profile[]).map((p) => [p.id, p])));
    } else {
      setRequestProfiles(new Map());
    }
    setBlockedIds(
      new Set(
        ((blockRows || []) as { blocker_id: string; blocked_id: string }[])
          .filter((row) => row.blocker_id === currentUserId)
          .map((row) => row.blocked_id)
      )
    );
    setMutedIds(new Set(((muteRows || []) as { peer_id: string }[]).map((row) => row.peer_id)));
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setRequests([]);
      setBlockedIds(new Set());
      setMutedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    reload();
  }, [currentUserId, reload]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`social:${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' }, () => {
        reload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => {
        reload();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, reload]);

  const contactIds = useMemo(() => {
    if (!currentUserId) return new Set<string>();
    const ids = new Set<string>();
    requests.forEach((req) => {
      if (req.status !== 'accepted') return;
      ids.add(req.requester_id === currentUserId ? req.addressee_id : req.requester_id);
    });
    return ids;
  }, [requests, currentUserId]);

  const incoming = useMemo(
    () =>
      requests.filter(
        (req) => req.status === 'pending' && currentUserId && req.addressee_id === currentUserId
      ),
    [requests, currentUserId]
  );

  const outgoing = useMemo(
    () =>
      requests.filter(
        (req) => req.status === 'pending' && currentUserId && req.requester_id === currentUserId
      ),
    [requests, currentUserId]
  );

  const relationWith = useCallback(
    (peerId: string): Relation => {
      if (!currentUserId) return { kind: 'none' };
      if (peerId === currentUserId) return { kind: 'self' };
      if (blockedIds.has(peerId)) return { kind: 'blocked' };
      const accepted = requests.find(
        (req) =>
          req.status === 'accepted' &&
          ((req.requester_id === currentUserId && req.addressee_id === peerId) ||
            (req.requester_id === peerId && req.addressee_id === currentUserId))
      );
      if (accepted) return { kind: 'contact' };
      const pending = requests.find(
        (req) =>
          req.status === 'pending' &&
          ((req.requester_id === currentUserId && req.addressee_id === peerId) ||
            (req.requester_id === peerId && req.addressee_id === currentUserId))
      );
      if (pending) {
        return pending.requester_id === currentUserId
          ? { kind: 'outgoing', request: pending }
          : { kind: 'incoming', request: pending };
      }
      return { kind: 'none' };
    },
    [currentUserId, blockedIds, requests]
  );

  const sendRequest = useCallback(
    async (peerId: string) => {
      if (!currentUserId || peerId === currentUserId) return;
      const existing = requests.find(
        (req) =>
          (req.requester_id === currentUserId && req.addressee_id === peerId) ||
          (req.requester_id === peerId && req.addressee_id === currentUserId)
      );
      if (existing?.status === 'declined') {
        const { error } = await supabase
          .from('contact_requests')
          .update({
            requester_id: currentUserId,
            addressee_id: peerId,
            status: 'pending',
            responded_at: null,
          })
          .eq('id', existing.id);
        if (error) {
          console.error('Error sending contact request:', error.message);
          return false;
        }
        await reload();
        return true;
      }
      const { error } = await supabase.from('contact_requests').insert({
        requester_id: currentUserId,
        addressee_id: peerId,
        status: 'pending',
      });
      if (error) {
        console.error('Error sending contact request:', error.message);
        return false;
      }
      await reload();
      return true;
    },
    [currentUserId, reload, requests]
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) {
        console.error('Error accepting contact request:', error.message);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) {
        console.error('Error declining contact request:', error.message);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      const { error } = await supabase.from('contact_requests').delete().eq('id', requestId);
      if (error) {
        console.error('Error cancelling contact request:', error.message);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const blockUser = useCallback(
    async (peerId: string) => {
      if (!currentUserId) return false;
      const { error } = await supabase.from('blocks').insert({
        blocker_id: currentUserId,
        blocked_id: peerId,
      });
      if (error) {
        console.error('Error blocking user:', error.message);
        return false;
      }
      await supabase
        .from('contact_requests')
        .delete()
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${peerId}),and(requester_id.eq.${peerId},addressee_id.eq.${currentUserId})`
        );
      await reload();
      return true;
    },
    [currentUserId, reload]
  );

  const unblockUser = useCallback(
    async (peerId: string) => {
      if (!currentUserId) return false;
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', peerId);
      if (error) {
        console.error('Error unblocking user:', error.message);
        return false;
      }
      await reload();
      return true;
    },
    [currentUserId, reload]
  );

  const mutePeer = useCallback(
    async (peerId: string) => {
      if (!currentUserId) return false;
      const { error } = await supabase.from('conversation_mutes').upsert({
        user_id: currentUserId,
        peer_id: peerId,
      });
      if (error) {
        console.error('Error muting conversation:', error.message);
        return false;
      }
      setMutedIds((prev) => new Set(prev).add(peerId));
      return true;
    },
    [currentUserId]
  );

  const unmutePeer = useCallback(
    async (peerId: string) => {
      if (!currentUserId) return false;
      const { error } = await supabase
        .from('conversation_mutes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('peer_id', peerId);
      if (error) {
        console.error('Error unmuting conversation:', error.message);
        return false;
      }
      setMutedIds((prev) => {
        const next = new Set(prev);
        next.delete(peerId);
        return next;
      });
      return true;
    },
    [currentUserId]
  );

  return {
    loading,
    requests,
    incoming,
    outgoing,
    contactIds,
    requestProfiles,
    blockedIds,
    mutedIds,
    relationWith,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    blockUser,
    unblockUser,
    mutePeer,
    unmutePeer,
  };
}
