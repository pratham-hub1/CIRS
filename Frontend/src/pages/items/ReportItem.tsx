import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileQuestion,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  X,
  Info,
  AlertCircle,
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
import { FormField } from '../../components/a11y/FormField';
import { LiveRegion } from '../../components/a11y/LiveRegion';
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
  // Announced via a live region so validation errors reach screen-reader users.
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);

    if (
      !itemName.trim() ||
      !description.trim() ||
      !colour.trim() ||
      !brand.trim() ||
      !identifyingMarks.trim()
    ) {
      const msg = 'Please complete all required fields.';
      setFormError(msg);
      error(msg);
      return;
    }

    if (isAdmin && type === ItemType.FOUND && !storageLocationId) {
      const msg = 'Please select the campus storage location where this found item is deposited.';
      setFormError(msg);
      error(msg);
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
      const msg = err.message || 'Failed to submit report. Please check your information.';
      setFormError(msg);
      error(msg);
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
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white transition-colors border border-transparent hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                aria-label={`Copy case ID ${createdItem.caseId}`}
              >
                {copiedId ? (
                  <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="text-xs text-slate-600 mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
              <span>Item: <strong className="text-slate-800">{createdItem.itemName}</strong></span>
              <span className="text-[11px] text-slate-400">{CATEGORY_LABELS[createdItem.category]}</span>
            </div>
          </div>
          <LiveRegion
            politeness="polite"
            className="sr-only"
            message={copiedId ? 'Case ID copied to clipboard' : ''}
          />

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/items/${createdItem.caseId}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full">
                <span>Open Case Details</span>
                <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
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
      <div
        className="bg-slate-200/60 p-1.5 rounded-2xl flex space-x-2 border border-slate-200"
        role="group"
        aria-label="Report type"
      >
        <button
          type="button"
          onClick={() => setType(ItemType.LOST)}
          aria-pressed={type === ItemType.LOST}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
            type === ItemType.LOST
              ? 'bg-white text-rose-700 shadow-subtle border border-rose-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileQuestion className="w-4 h-4 mr-2 text-rose-500" aria-hidden="true" />
          I Lost An Item
        </button>
        <button
          type="button"
          onClick={() => setType(ItemType.FOUND)}
          aria-pressed={type === ItemType.FOUND}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
            type === ItemType.FOUND
              ? 'bg-white text-emerald-700 shadow-subtle border border-emerald-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" aria-hidden="true" />
          I Found An Item
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-9 space-y-7"
      >
        {/* Form-level validation summary, announced to assistive tech. */}
        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {/* Core Specs */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center" aria-hidden="true">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Item Specifications
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="item-title" label="Item Title" required>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Dell XPS 13 or Leather Wallet"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              />
            </FormField>

            <FormField id="category" label="Category" required>
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
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField id="colour" label="Primary Colour" required>
              <input
                type="text"
                required
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                placeholder="e.g. Space Grey"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>

            <FormField id="brand" label="Brand / Make" required>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Dell, Titan"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>

            <FormField id="serial-number" label="Serial Number (Optional)">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-8849201"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </FormField>
          </div>

          <FormField
            id="identifying-marks"
            label="Identifying Marks & Distinguishing Features"
            required
            helpText="Security officers use these details to cross-examine claims."
          >
            <textarea
              required
              rows={2}
              value={identifyingMarks}
              onChange={(e) => setIdentifyingMarks(e.target.value)}
              placeholder="e.g. Stickers on lid, initials carved, scratch on bottom bezel, specific keychain..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
          </FormField>

          <FormField id="description" label="Full Description & Context" required>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive description of the item and circumstances..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
            />
          </FormField>
        </div>

        {/* Date and Location Specifics */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center" aria-hidden="true">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {type === ItemType.LOST ? 'Loss Incident Timeline' : 'Discovery & Custody Desk'}
            </h3>
          </div>

          {type === ItemType.LOST ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="date-lost" label="Estimated Date & Time Lost" required>
                <input
                  type="datetime-local"
                  required
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                />
              </FormField>

              <FormField id="last-known-location" label="Last Known Location">
                <input
                  type="text"
                  value={lastKnownLocation}
                  onChange={(e) => setLastKnownLocation(e.target.value)}
                  placeholder="e.g. Science Block Lab 2 or Cafeteria Ground"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </FormField>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="date-found" label="Date & Time Found" required>
                  <input
                    type="datetime-local"
                    required
                    value={dateFound}
                    onChange={(e) => setDateFound(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white font-medium"
                  />
                </FormField>

                <FormField id="found-location" label="Location Where Found">
                  <input
                    type="text"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    placeholder="e.g. Library 2nd Floor Reading Room"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                  />
                </FormField>
              </div>

              {isAdmin ? (
                <FormField
                  id="storage-location"
                  label="Campus Custody Storage Location"
                  required
                  helpText={
                    <span className="text-[11px] text-slate-500 flex items-center">
                      <Info className="w-3.5 h-3.5 mr-1 text-slate-400" aria-hidden="true" />
                      Select the official campus security locker where you physically deposited the item.
                    </span>
                  }
                >
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
                </FormField>
              ) : (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
                  <div className="flex items-start space-x-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
            <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center" aria-hidden="true">
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
            <ul className="flex flex-wrap gap-3 pt-2 list-none" aria-label="Uploaded photographs">
              {uploadedImages.map((img, idx) => (
                <li
                  key={idx}
                  className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden shadow-subtle group"
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`Uploaded photograph ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label={`Remove uploaded photograph ${idx + 1}`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
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
