import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileQuestion,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Building2,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { adminService } from '../../services/adminService';
import {
  ItemCategory,
  ItemType,
  CATEGORY_LABELS,
  StorageLocationName,
  STORAGE_LOCATION_LABELS,
} from '../../types/enums';
import { StorageLocation } from '../../types/admin';
import { FileUpload } from '../../components/common/FileUpload';
import { Button } from '../../components/common/Button';
import { FadeIn } from '../../components/common/AnimatedTransitions';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { resolveImageUrl } from '../../services/apiClient';
import { CreateItemPayload, Item } from '../../types/item';

export const ReportItem: React.FC = () => {
  const { initialType } = useParams<{ initialType?: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const [type, setType] = useState<ItemType>(
    initialType?.toUpperCase() === 'FOUND' ? ItemType.FOUND : ItemType.LOST,
  );

  // Storage locations list for FOUND reports
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.ELECTRONICS);
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState('');
  const [brand, setBrand] = useState('');
  const [identifyingMarks, setIdentifyingMarks] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Conditional fields
  const [dateLost, setDateLost] = useState(new Date().toISOString().slice(0, 16));
  const [lastKnownLocation, setLastKnownLocation] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().slice(0, 16));
  const [foundLocation, setFoundLocation] = useState('');
  const [storageLocationId, setStorageLocationId] = useState('');

  // Image uploads
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (initialType) {
      setType(initialType.toUpperCase() === 'FOUND' ? ItemType.FOUND : ItemType.LOST);
    }
  }, [initialType]);

  useEffect(() => {
    if (!isAdmin) {
      setStorageLocations([]);
      return;
    }
    const fetchStorageLocations = async () => {
      try {
        const locations = await adminService.getStorageLocations();
        setStorageLocations(locations || []);
        if (locations && locations.length > 0) {
          setStorageLocationId(locations[0].id);
        }
      } catch (err) {
        console.warn('Could not fetch storage locations:', err);
      }
    };
    fetchStorageLocations();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !itemName.trim() ||
      !description.trim() ||
      !colour.trim() ||
      !brand.trim() ||
      !identifyingMarks.trim()
    ) {
      error('Please complete all required fields.');
      return;
    }

    if (isAdmin && type === ItemType.FOUND && !storageLocationId) {
      error('Please select the campus storage location where this found item is deposited.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateItemPayload = {
        type,
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        colour: colour.trim(),
        brand: brand.trim(),
        identifyingMarks: identifyingMarks.trim(),
        serialNumber: serialNumber.trim() || undefined,
        images: uploadedImages,
      };

      if (type === ItemType.LOST) {
        payload.dateLost = new Date(dateLost).toISOString();
        payload.lastKnownLocation = lastKnownLocation.trim() || undefined;
      } else {
        payload.dateFound = new Date(dateFound).toISOString();
        payload.foundLocation = foundLocation.trim() || undefined;
        if (storageLocationId) {
          payload.storageLocationId = storageLocationId;
        }
      }

      const item = await itemsService.createItem(payload);
      setCreatedItem(item);
      success(`Report submitted successfully! Case ID: ${item.caseId}`);
    } catch (err: any) {
      console.error('Error creating report:', err);
      error(err.message || 'Failed to submit report. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCaseId = (caseId: string) => {
    navigator.clipboard.writeText(caseId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Success view
  if (createdItem) {
    return (
      <FadeIn className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-elevated text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-subtle ring-4 ring-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Case Registered Successfully
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal max-w-md mx-auto">
            Your {createdItem.type.toLowerCase()} report is officially logged. The system will now scan for matching items and alert security staff.
          </p>

          <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left w-full max-w-md mx-auto shadow-subtle">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px]">Official Case ID</span>
              <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {createdItem.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-extrabold text-brand-700">
                {createdItem.caseId}
              </span>
              <button
                onClick={() => handleCopyCaseId(createdItem.caseId)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
                title="Copy Case ID"
              >
                {copiedId ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-xs text-slate-600 mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
              <span>Item: <strong className="text-slate-800">{createdItem.itemName}</strong></span>
              <span className="text-[11px] text-slate-400">{CATEGORY_LABELS[createdItem.category]}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/items/${createdItem.caseId}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full">
                <span>Open Case Details</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setCreatedItem(null);
                setItemName('');
                setDescription('');
                setBrand('');
                setColour('');
                setIdentifyingMarks('');
                setSerialNumber('');
                setUploadedImages([]);
              }}
              className="w-full sm:w-auto"
            >
              Submit Another Report
            </Button>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
            Official Incident Intake
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          File a Campus Item Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal">
          Accurate specifications ensure faster matching against custody records and verify rightful ownership.
        </p>
      </div>

      {/* Type Toggle Tabs */}
      <div className="bg-slate-200/60 p-1.5 rounded-2xl flex space-x-2 border border-slate-200">
        <button
          type="button"
          onClick={() => setType(ItemType.LOST)}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center transition-all ${
            type === ItemType.LOST
              ? 'bg-white text-rose-700 shadow-subtle border border-rose-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileQuestion className="w-4 h-4 mr-2 text-rose-500" />
          I Lost An Item
        </button>
        <button
          type="button"
          onClick={() => setType(ItemType.FOUND)}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center transition-all ${
            type === ItemType.FOUND
              ? 'bg-white text-emerald-700 shadow-subtle border border-emerald-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
          I Found An Item
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-9 space-y-7"
      >
        {/* Core Specs */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Item Specifications
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Dell XPS 13 or Leather Wallet"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
              >
                {Object.values(ItemCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Primary Colour <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                placeholder="e.g. Space Grey"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Brand / Make <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Dell, Titan"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-8849201"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Identifying Marks & Distinguishing Features <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={identifyingMarks}
              onChange={(e) => setIdentifyingMarks(e.target.value)}
              placeholder="e.g. Stickers on lid, initials carved, scratch on bottom bezel, specific keychain..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
            <p className="mt-1 text-[11px] text-slate-400 font-normal">
              Security officers use these details to cross-examine claims.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Description & Context <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive description of the item and circumstances..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
          </div>
        </div>

        {/* Date and Location Specifics */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {type === ItemType.LOST ? 'Loss Incident Timeline' : 'Discovery & Custody Desk'}
            </h3>
          </div>

          {type === ItemType.LOST ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Estimated Date & Time Lost <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Last Known Location
                </label>
                <input
                  type="text"
                  value={lastKnownLocation}
                  onChange={(e) => setLastKnownLocation(e.target.value)}
                  placeholder="e.g. Science Block Lab 2 or Cafeteria Ground"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Date & Time Found <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateFound}
                    onChange={(e) => setDateFound(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Location Where Found
                  </label>
                  <input
                    type="text"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    placeholder="e.g. Library 2nd Floor Reading Room"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                  />
                </div>
              </div>

              {isAdmin ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Campus Custody Storage Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={storageLocationId}
                    onChange={(e) => setStorageLocationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                  >
                    {storageLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {STORAGE_LOCATION_LABELS[loc.name as StorageLocationName] || loc.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500 flex items-center">
                    <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Select the official campus security locker where you physically deposited the item.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs text-amber-900">
                      <p className="font-semibold text-slate-900">Physical Custody Intake Protocol</p>
                      <p className="text-slate-600 leading-relaxed">
                        Found items must be physically surrendered to <strong>Campus Security (Main Gate)</strong> or the <strong>Central Lost &amp; Found Desk</strong>. The duty security officer will inspect the item and assign the secure storage locker ID upon intake.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Media / Images Upload */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Visual Verification (Optional)
            </h3>
          </div>

          <FileUpload
            label="Upload Clear Photographs"
            helperText="Clear photos of serial barcodes, unique scratches, or cases dramatically expedite recovery."
            onUploadSuccess={(url) => setUploadedImages((prev) => [...prev, url])}
          />

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {uploadedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden shadow-subtle group"
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={type === ItemType.LOST ? 'danger' : 'success'}
            isLoading={isSubmitting}
            className="px-6"
          >
            Submit {type === ItemType.LOST ? 'Lost' : 'Found'} Report
          </Button>
        </div>
      </form>
    </FadeIn>
  );
};
