import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Package } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { StorageLocation } from '../../types/admin';
import { StorageLocationName, STORAGE_LOCATION_LABELS } from '../../types/enums';
import { Modal } from '../../components/common/Modal';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/AnimatedTransitions';
import { Button } from '../../components/common/Button';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../context/ToastContext';
import { celebrateConfetti } from '../../lib/confetti';

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
        celebrateConfetti();
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
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06]">
              Custody Infrastructure
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
            Storage Locations & Lockers
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Authorized physical holding facilities across GSFC University for found property custody.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="sm"
          className="self-start sm:self-auto inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Storage Desk
        </Button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-xs font-mono text-neutral-500">
          Loading authorized storage facilities...
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-[#12151D] p-12 rounded-2xl border border-white/[0.08] text-center text-neutral-400">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-white">No storage locations registered yet</p>
          <p className="text-xs text-neutral-500 mt-1">Add a campus desk or security locker to start assigning found items.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <StaggerItem key={loc.id}>
              <GlassCard enableTilt enableSheen className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-neutral-300 flex items-center justify-center border border-white/[0.06]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <button
                      onClick={() => handleOpenEdit(loc)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
                      title="Edit Location"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-white text-base">
                    {STORAGE_LOCATION_LABELS[loc.name] || loc.name}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono block mt-0.5">
                    ID: {loc.id}
                  </span>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center text-xs text-neutral-400">
                    <Package className="w-4 h-4 mr-2 text-neutral-500" />
                    <span>
                      Secured Inventory:{' '}
                      <strong className="text-white font-medium">{loc._count?.items ?? 0} items</strong>
                    </span>
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
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
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Location Facility
            </label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value as StorageLocationName)}
              className="w-full px-3 py-2 text-sm border border-white/[0.08] rounded-xl bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {Object.values(StorageLocationName).map((n) => (
                <option key={n} value={n} className="bg-[#12151D]">
                  {STORAGE_LOCATION_LABELS[n]} ({n})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {editingLocation ? 'Update Desk' : 'Register Desk'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};
