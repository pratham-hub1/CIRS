import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { matchingService } from '../../services/matchingService';
import { claimsService } from '../../services/claimsService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Item, CaseMessage } from '../../types/item';
import { Match } from '../../types/matching';
import { ItemStatus, ItemType, Role, MatchStatus, CATEGORY_LABELS } from '../../types/enums';
import { ItemStatusBadge, ItemTypeBadge, CategoryBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SubmitClaimModal } from '../claims/SubmitClaimModal';

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

      // Load case messages and matches in parallel
      const [msgsRes, matchesRes] = await Promise.allSettled([
        itemsService.getCaseMessages(caseId),
        matchingService.getMatchesForCase(caseId),
      ]);
      if (msgsRes.status === 'fulfilled') setMessages(msgsRes.value || []);
      if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value || []);
    } catch (err: any) {
      console.error('Error loading case:', err);
      error(err.message || 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  }, [caseId, error]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const isOwner = user && item && item.reporterId === user.id;
  const isEditable = isOwner && (item?.status === ItemStatus.LOST_REPORTED || item?.status === ItemStatus.FOUND);
  const canClaim = !isOwner && item?.type === ItemType.FOUND && item?.status !== ItemStatus.RETURNED && item?.status !== ItemStatus.ARCHIVED;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    setIsSavingEdit(true);
    try {
      const updated = await itemsService.editItem(caseId, {
        itemName: editName.trim(),
        description: editDesc.trim(),
        brand: editBrand.trim(),
        colour: editColour.trim(),
      });
      setItem(updated);
      setShowEditModal(false);
      success('Case details updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update case');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelCase = async () => {
    if (!caseId) return;
    setIsCanceling(true);
    try {
      const updated = await itemsService.cancelItem(caseId);
      setItem(updated);
      setShowCancelDialog(false);
      success('Case has been cancelled');
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
      success('Message sent to staff');
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
      success('Item receipt confirmed! The case is now successfully completed.');
      loadCase();
    } catch (err: any) {
      error(err.message || 'Failed to confirm receipt');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading case details..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Case Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested case could not be located.</p>
        <button
          onClick={() => navigate('/feed')}
          className="mt-4 px-4 py-2 text-sm font-medium text-brand-600 hover:underline"
        >
          ← Return to Community Feed
        </button>
      </div>
    );
  }

  const imagesList = (item.images || []).map((img) => (typeof img === 'string' ? img : img.url));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </button>

        <div className="flex items-center space-x-2">
          {isEditable && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Edit Case
              </button>
              <button
                onClick={() => setShowCancelDialog(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel Case
              </button>
            </>
          )}

          {canClaim && (
            <button
              onClick={() => setShowClaimModal(true)}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Claim Ownership
            </button>
          )}

          {isOwner && (item.status === ItemStatus.READY_FOR_COLLECTION) && (
            <button
              onClick={handleConfirmReceipt}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Confirm Receipt
            </button>
          )}
        </div>
      </div>

      {/* Main Case Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle">
        {/* Banner with tags & status */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <ItemTypeBadge type={item.type} />
            <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {item.caseId}
            </span>
            <CategoryBadge category={item.category} />
          </div>
          <ItemStatusBadge status={item.status} size="md" />
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Photos / Gallery */}
          <div className="md:col-span-1 space-y-3">
            {imagesList.length > 0 ? (
              <div className="space-y-2">
                <div className="h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={imagesList[0]}
                    alt={item.itemName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {imagesList.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagesList.slice(1).map((img, idx) => (
                      <div key={idx} className="h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <Package className="w-12 h-12 mb-2 stroke-1" />
                <span className="text-xs">No photograph provided</span>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{item.itemName}</h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">
                  Brand
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{item.brand || 'Unbranded'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">
                  Colour
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{item.colour}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">
                  Serial Number
                </span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                  {item.serialNumber || 'N/A'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">
                  Identifying Marks & Features
                </span>
                <span className="text-slate-800 mt-0.5 block leading-relaxed">
                  {item.identifyingMarks || 'None stated'}
                </span>
              </div>
            </div>

            {/* Date & Location Specifics */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                <span>
                  <strong>Location:</strong>{' '}
                  {item.foundLocation || item.lastKnownLocation || 'Campus premises'}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                <span>
                  <strong>Reported on:</strong>{' '}
                  {new Date(item.createdAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {item.storageLocation && (
                <div className="flex items-center text-brand-700 bg-brand-50/80 px-3 py-2 rounded-lg border border-brand-100 font-medium">
                  <Building2 className="w-4 h-4 mr-2 text-brand-600 flex-shrink-0" />
                  <span>
                    Secured Custody Desk: <strong>{item.storageLocation.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Matches Section */}
      {matches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-brand-600" />
              Potential Matches Detected ({matches.length})
            </h2>
          </div>

          <div className="space-y-3">
            {matches.map((m) => {
              const matchedItem = item.type === ItemType.LOST ? m.foundItem : m.lostItem;
              return (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800">
                        {(m.score * 100).toFixed(0)}% Match Score
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {matchedItem?.caseId}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {matchedItem?.itemName || 'Opposite Item'}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {matchedItem?.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Link
                      to={`/items/${matchedItem?.caseId}`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Inspect Match
                    </Link>

                    {isAdmin && m.status === MatchStatus.SUGGESTED && (
                      <>
                        <button
                          onClick={() => handleConfirmMatch(m.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleDismissMatch(m.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff-mediated Case Messages Thread */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2 text-brand-600" />
          Staff-Mediated Case Communication
        </h2>
        <p className="text-xs text-slate-500">
          Messages sent here are securely mediated by campus security officers to coordinate safe recovery without public contact disclosure.
        </p>

        {/* Messages List */}
        <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">
              No messages posted yet for this case.
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-800">
                    {msg.sender?.name || 'Authorized Member'}
                    {msg.sender?.role === Role.ADMIN && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-brand-100 text-brand-700 font-bold uppercase">
                        Staff
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {msg.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
          <input
            type="text"
            required
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to campus security..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={isSendingMessage}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send
          </button>
        </form>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Case Report"
        description="Update item specifications within the editable window."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                required
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Colour
              </label>
              <input
                type="text"
                required
                value={editColour}
                onChange={(e) => setEditColour(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Case Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelCase}
        title="Cancel This Case?"
        message="Are you sure you want to cancel and close this case? This action will archive the case and prevent further match notifications."
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
    </div>
  );
};
