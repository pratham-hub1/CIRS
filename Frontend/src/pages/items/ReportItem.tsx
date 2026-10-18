import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileQuestion,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Building2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { itemsService } from '../../services/itemsService';
import { adminService } from '../../services/adminService';
import { ItemCategory, ItemType, CATEGORY_LABELS, StorageLocationName, STORAGE_LOCATION_LABELS } from '../../types/enums';
import { StorageLocation } from '../../types/admin';
import { FileUpload } from '../../components/common/FileUpload';
import { useToast } from '../../context/ToastContext';
import { CreateItemPayload, Item } from '../../types/item';

export const ReportItem: React.FC = () => {
  const { initialType } = useParams<{ initialType?: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

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

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (initialType) {
      setType(initialType.toUpperCase() === 'FOUND' ? ItemType.FOUND : ItemType.LOST);
    }
  }, [initialType]);

  useEffect(() => {
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName.trim() || !description.trim() || !colour.trim() || !brand.trim() || !identifyingMarks.trim()) {
      error('Please complete all required fields.');
      return;
    }

    if (type === ItemType.FOUND && !storageLocationId) {
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
        payload.storageLocationId = storageLocationId;
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

  // Success view
  if (createdItem) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-elevated text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Report Successfully Submitted</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your {createdItem.type.toLowerCase()} report has been registered into the recovery system.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block text-left w-full max-w-sm">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>Official Case ID</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {createdItem.status}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-brand-700">{createdItem.caseId}</div>
            <div className="text-xs text-slate-600 mt-2">
              Item: <span className="font-semibold text-slate-800">{createdItem.itemName}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/items/${createdItem.caseId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm"
            >
              Open Case Details <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            <button
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
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Report an Item
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide detailed specifications to aid accurate matching and verification by campus security.
        </p>
      </div>

      {/* Type Toggle Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex space-x-2 border border-slate-200">
        <button
          type="button"
          onClick={() => setType(ItemType.LOST)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
            type === ItemType.LOST
              ? 'bg-white text-rose-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileQuestion className="w-4 h-4 mr-2" />
          I Lost An Item
        </button>
        <button
          type="button"
          onClick={() => setType(ItemType.FOUND)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
            type === ItemType.FOUND
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          I Found An Item
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
        {/* Core Specs */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Item Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Dell XPS 13 Laptop or Black WildHorn Wallet"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Primary Colour <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                placeholder="e.g. Platinum Silver, Navy Blue"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Brand / Manufacturer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Dell, Apple, WildHorn"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. CN-0ABC12-34567"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Identifying Marks & Distinguishing Features <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={identifyingMarks}
              onChange={(e) => setIdentifyingMarks(e.target.value)}
              placeholder="e.g. Stickers, scratches, engraved initials, specific keychains, screen damage..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item, circumstances, and any other relevant context..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Date and Location Specifics */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. {type === ItemType.LOST ? 'Loss Incident Details' : 'Discovery Details'}
          </h3>

          {type === ItemType.LOST ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Estimated Date & Time Lost <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Last Known Location
                </label>
                <input
                  type="text"
                  value={lastKnownLocation}
                  onChange={(e) => setLastKnownLocation(e.target.value)}
                  placeholder="e.g. Science Block Lab 2 or Cafeteria Lawn"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Date & Time Found <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateFound}
                    onChange={(e) => setDateFound(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Found Location
                  </label>
                  <input
                    type="text"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    placeholder="e.g. Auditorium B Row 4 or Library Desk"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Campus Custody / Storage Location <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={storageLocationId}
                  onChange={(e) => setStorageLocationId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {storageLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {STORAGE_LOCATION_LABELS[loc.name as StorageLocationName] || loc.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Select the official campus desk where the item has been physically deposited.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Media / Images Upload */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Photographs (Optional)
          </h3>
          <FileUpload
            label="Upload Clear Photo"
            helperText="Upload photos showing distinguishing features. Max size: 10 MB."
            onUploadSuccess={(url) => setUploadedImages((prev) => [...prev, url])}
          />
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all disabled:opacity-50 ${
              type === ItemType.LOST
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
            }`}
          >
            {isSubmitting ? 'Submitting Report...' : `Submit ${type === ItemType.LOST ? 'Lost' : 'Found'} Report`}
          </button>
        </div>
      </form>
    </div>
  );
};
