import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Building2,
  Tag,
  Shield,
  MessageSquare,
  Sparkles,
  Edit3,
  XCircle,
  CheckCircle2,
  Package,
  Layers,
  Send,
  ArrowLeft,
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Eye,
  X,
  Archive,
} from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { matchingService } from '../../services/matchingService';
import { claimsService } from '../../services/claimsService';
import { resolveImageUrl } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Item, CaseMessage } from '../../types/item';
import { Match } from '../../types/matching';
import { ItemStatus, ItemType, Role, MatchStatus, CATEGORY_LABELS } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { SubmitClaimModal } from '../claims/SubmitClaimModal';
import { formatRelativeTime } from '../../lib/utils';
import { celebrateConfetti } from '../../lib/confetti';

export const ItemDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Action states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editColour, setEditColour] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const data = await itemsService.getItemByCaseId(caseId);
      setItem(data as Item);
      setEditName(data.itemName);
      setEditDesc(data.description);
      setEditBrand(data.brand);
      setEditColour(data.colour);

      const hasPrivilegedAccess = Boolean(
        (user && (data as Item).reporterId === user.id) || isAdmin,
      );
      if (hasPrivilegedAccess) {
        const [msgsRes, matchesRes] = await Promise.allSettled([
          itemsService.getCaseMessages(caseId),
          matchingService.getMatchesForCase(caseId),
        ]);
        if (msgsRes.status === 'fulfilled') setMessages(msgsRes.value || []);
        if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value || []);
      }
    } catch (err: any) {
      console.error('Error loading case:', err);
      error(err.message || 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  }, [caseId, user, isAdmin, error]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const isOwner = Boolean(user && item && item.reporterId === user.id);
  const isEditable = Boolean(isOwner && item?.status === ItemStatus.LOST_REPORTED);
  const canClaim = Boolean(
    item?.type === ItemType.FOUND &&
      !isOwner &&
      item.status !== ItemStatus.RETURNED &&
      item.status !== ItemStatus.ARCHIVED,
  );
  const canViewPrivateDetails = Boolean(isOwner || isAdmin);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    setIsSavingEdit(true);
    try {
      const updated = await itemsService.editItem(caseId, {
        itemName: editName,
        description: editDesc,
        brand: editBrand,
        colour: editColour,
      });
      setItem(updated as Item);
      success('Specifications updated successfully');
      setShowEditModal(false);
    } catch (err: any) {
      error(err.message || 'Failed to update item specifications');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelCase = async () => {
    if (!caseId) return;
    setIsCanceling(true);
    try {
      await itemsService.cancelItem(caseId);
      success('Case cancelled successfully');
      setShowCancelDialog(false);
      loadCase();
    } catch (err: any) {
      error(err.message || 'Failed to cancel case');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const sent = await itemsService.addCaseMessage(caseId, newMessage.trim());
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      success('Message delivered to campus security desk');
    } catch (err: any) {
      error(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleConfirmMatch = async (matchId: string) => {
    try {
      await matchingService.confirmMatch(matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: MatchStatus.CONFIRMED } : m)),
      );
      success('Match confirmed');
    } catch (err: any) {
      error(err.message || 'Failed to confirm match');
    }
  };

  const handleDismissMatch = async (matchId: string) => {
    try {
      await matchingService.dismissMatch(matchId);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: MatchStatus.DISMISSED } : m)),
      );
      success('Match dismissed');
    } catch (err: any) {
      error(err.message || 'Failed to dismiss match');
    }
  };

  const handleConfirmReceipt = async () => {
    if (!caseId) return;
    try {
      await claimsService.confirmReceipt(caseId);
      celebrateConfetti();
      success('Item receipt confirmed! The case is now successfully completed.');
      loadCase();
    } catch (err: any) {
      error(err.message || 'Failed to confirm receipt');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Retrieving secure case dossier..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-10 text-center bg-[#12151D] rounded-2xl border border-white/[0.07] max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Case Record Not Found</h3>
        <p className="text-xs text-neutral-400 mt-1">
          The requested case ID could not be located in the university repository.
        </p>
        <button
          onClick={() => navigate('/feed')}
          className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.12] rounded-xl transition-colors"
        >
          Return to Community Feed
        </button>
      </div>
    );
  }

  const imagesList = (item.images || [])
    .map((img) => resolveImageUrl(typeof img === 'string' ? img : img.url))
    .filter(Boolean);

  const getLifecycleStep = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.LOST_REPORTED:
        return 1;
      case ItemStatus.FOUND:
        return 2;
      case ItemStatus.READY_FOR_COLLECTION:
        return 3;
      case ItemStatus.RETURNED:
      case ItemStatus.ARCHIVED:
      case ItemStatus.UNCLAIMED:
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getLifecycleStep(item.status);

  return (
    <FadeIn className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Top back bar and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-neutral-400" /> Back to directory
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {isEditable && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
                Edit Specifications
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel Case
              </Button>
            </>
          )}

          {canClaim && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowClaimModal(true)}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Claim This Item
            </Button>
          )}

          {isOwner && item.status === ItemStatus.READY_FOR_COLLECTION && (
            <Button
              variant="success"
              size="sm"
              onClick={handleConfirmReceipt}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Confirm Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Case Lifecycle Progress Tracker */}
      <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
            LIFECYCLE STATUS
          </span>
          <ItemStatusBadge status={item.status} size="sm" />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { step: 1, label: 'Reported' },
            { step: 2, label: 'In Custody / Matching' },
            { step: 3, label: 'Ready for Collection' },
            { step: 4, label: 'Resolved & Returned' },
          ].map((st) => (
            <div key={st.step} className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs mb-2 transition-all ${
                  currentStep >= st.step
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-neutral-800 text-neutral-500 border border-white/[0.06]'
                }`}
              >
                {currentStep > st.step ? <Check className="w-4 h-4" /> : st.step}
              </div>
              <span
                className={`text-[11px] font-medium leading-tight ${
                  currentStep >= st.step ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Case Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photos & Custody info */}
        <div className="space-y-6">
          <div className="bg-[#12151D] rounded-2xl border border-white/[0.07] p-4 overflow-hidden">
            {imagesList.length > 0 ? (
              <div className="space-y-3">
                <div
                  onClick={() => setPreviewImage(imagesList[0])}
                  className="h-72 rounded-xl overflow-hidden bg-neutral-900 border border-white/[0.06] cursor-pointer relative group"
                >
                  <img
                    src={imagesList[0]}
                    alt={item.itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    <Eye className="w-4 h-4 mr-1.5" /> Enlarge image
                  </div>
                </div>
                {imagesList.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagesList.slice(1).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(img)}
                        className="h-18 rounded-lg overflow-hidden border border-white/[0.06] bg-neutral-900 cursor-pointer hover:border-white/30 transition-all"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed border-white/10 bg-neutral-900/50 flex flex-col items-center justify-center text-neutral-500 p-4 text-center">
                <Package className="w-10 h-10 mb-2 stroke-1 text-neutral-600" />
                <span className="text-xs">No photographic evidence attached</span>
              </div>
            )}
          </div>

          {/* Custody Vault Card */}
          {item.storageLocation && (
            <div className="p-5 rounded-2xl bg-[#12151D] border border-white/[0.07] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                <Archive className="w-4 h-4 text-neutral-400" />
                <span>Secured Custody Vault</span>
              </div>
              <p className="text-sm font-bold text-white">{item.storageLocation.name}</p>
              <p className="text-xs text-neutral-400">
                Official campus item custody repository
              </p>
            </div>
          )}
        </div>

        {/* Right Column (2 Cols): Specifications, Details, Messages & Matches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#12151D] border border-white/[0.07] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2.5">
                <ItemTypeBadge type={item.type} />
                <span className="font-mono text-xs text-neutral-400">#{item.caseId}</span>
                <CategoryBadge category={item.category} />
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                LOGGED {formatRelativeTime(item.createdAt)}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                {item.itemName}
              </h1>
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-900 border border-white/[0.06] text-xs font-mono">
              <div>
                <span className="text-neutral-500 block uppercase text-[10px]">Brand / Make</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {item.brand || 'Unbranded'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase text-[10px]">Colour</span>
                <span className="font-semibold text-white mt-0.5 block">{item.colour}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase text-[10px]">Serial Number</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {canViewPrivateDetails
                    ? item.serialNumber || 'N/A'
                    : '•••••••• (Verification required)'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-3 border-t border-white/[0.06]">
                <span className="text-neutral-500 block uppercase text-[10px]">
                  Identifying Marks & Features
                </span>
                <span className="text-neutral-300 mt-1 block font-sans text-xs">
                  {canViewPrivateDetails
                    ? item.identifyingMarks || 'None stated'
                    : '•••••••• (Protected under anti-fraud protocol. Distinguishing marks verified upon claim)'}
                </span>
              </div>
            </div>

            {/* Location & Timestamp details */}
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span>
                  <strong>Location:</strong>{' '}
                  {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span>
                  <strong>Report Date:</strong>{' '}
                  {new Date(item.createdAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Matches Section (Private to owner & staff) */}
          {canViewPrivateDetails && matches.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#12151D] border border-white/[0.07] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-display font-bold text-white flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
                  Automated Candidate Matches ({matches.length})
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">Ranked by similarity</span>
              </div>

              <div className="space-y-3">
                {matches.map((m) => {
                  const matchedItem = item.type === ItemType.LOST ? m.foundItem : m.lostItem;
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-neutral-900 gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-white border border-white/[0.1]">
                            {(m.score * 100).toFixed(0)}% Similarity
                          </span>
                          <span className="text-xs font-mono text-neutral-400">
                            #{matchedItem?.caseId}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white">
                          {matchedItem?.itemName || 'Opposite Item'}
                        </h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                          {matchedItem?.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Link to={`/items/${matchedItem?.caseId}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>

                        {isAdmin && m.status === MatchStatus.SUGGESTED && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleConfirmMatch(m.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismissMatch(m.id)}
                              className="text-neutral-400 hover:text-white"
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Security Communications Thread (Private to owner & staff) */}
          {canViewPrivateDetails && (
            <div className="p-6 rounded-2xl bg-[#12151D] border border-white/[0.07] space-y-4">
              <div>
                <h3 className="text-sm font-display font-bold text-white flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-neutral-400" />
                  Official Security Communications
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Direct encrypted coordination channel with campus security desk.
                </p>
              </div>

              {/* Messages List */}
              <div className="space-y-3 max-h-72 overflow-y-auto p-4 bg-neutral-900 rounded-xl border border-white/[0.06] scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500">
                    <p className="text-xs">No communications posted yet for this case.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStaff = msg.sender?.role === Role.ADMIN;
                    const isCurrentUser = user && msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 mb-1 px-1 font-mono">
                          <span className="font-semibold text-white">
                            {isCurrentUser ? 'You' : msg.sender?.name || 'Member'}
                          </span>
                          {isStaff && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-neutral-800 text-neutral-300 font-bold uppercase">
                              Staff
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isCurrentUser
                              ? 'bg-white text-black rounded-tr-none font-medium'
                              : isStaff
                              ? 'bg-neutral-800 text-white rounded-tl-none font-medium'
                              : 'bg-neutral-800/80 text-neutral-200 border border-white/[0.08] rounded-tl-none'
                          }`}
                        >
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type an official query or update to officers..."
                  className="flex-1 px-4 py-2.5 text-xs bg-neutral-900 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-neutral-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSendingMessage}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setPreviewImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img
                src={resolveImageUrl(previewImage)}
                alt="Enlarged preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                }}
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Case Report"
        description="Update item specifications within the editable window."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Item Title
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                required
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Colour
              </label>
              <input
                type="text"
                required
                value={editColour}
                onChange={(e) => setEditColour(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-white/10 rounded-xl bg-neutral-900 text-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Case Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelCase}
        title="Cancel This Case?"
        message="Are you sure you want to cancel and close this case? This action will archive the case and stop further automated match alerts."
        confirmLabel="Yes, Cancel Case"
        isDestructive={true}
        isLoading={isCanceling}
      />

      {/* Claim Submission Modal */}
      {caseId && (
        <SubmitClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          caseId={caseId}
          itemName={item.itemName}
          category={item.category}
          onSuccess={() => {
            setShowClaimModal(false);
            navigate('/my-claims');
          }}
        />
      )}
    </FadeIn>
  );
};
