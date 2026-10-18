import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Package } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { StorageLocation } from '../../types/admin';
import { StorageLocationName, STORAGE_LOCATION_LABELS } from '../../types/enums';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const AdminStorageLocations: React.FC = () => {
  const { success, error } = useToast();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [selectedName, setSelectedName] = useState<StorageLocationName>(StorageLocationName.SECURITY_OFFICE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getStorageLocations();
      setLocations(data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load storage locations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setSelectedName(StorageLocationName.SECURITY_OFFICE);
    setShowModal(true);
  };

  const handleOpenEdit = (loc: StorageLocation) => {
    setEditingLocation(loc);
    setSelectedName(loc.name);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await adminService.updateStorageLocation(editingLocation.id, { name: selectedName });
        success('Storage location updated');
      } else {
        await adminService.createStorageLocation({ name: selectedName });
        success('New storage location created');
      }
      setShowModal(false);
      fetchLocations();
    } catch (err: any) {
      error(err.message || 'Failed to save storage location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Storage Locations</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official physical custody desks across GSFC University for found belongings.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Storage Desk
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleOpenEdit(loc)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    title="Edit Location"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base">
                  {STORAGE_LOCATION_LABELS[loc.name] || loc.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">
                  ID: {loc.id}
                </span>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-600">
                  <Package className="w-4 h-4 mr-2 text-slate-400" />
                  <span>
                    Secured Inventory:{' '}
                    <strong className="text-slate-900 font-bold">{loc._count?.items ?? 0} items</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingLocation ? 'Edit Storage Desk' : 'Register Storage Desk'}
        description="Select an authorized campus storage facility location."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Location Name
            </label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value as StorageLocationName)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {Object.values(StorageLocationName).map((n) => (
                <option key={n} value={n}>
                  {STORAGE_LOCATION_LABELS[n]} ({n})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingLocation ? 'Update Desk' : 'Register Desk'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
