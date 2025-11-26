import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNetwork } from './useNetwork';
import localforage from 'localforage';
import toast from 'react-hot-toast';

interface PendingOperation {
  type: 'create' | 'update';
  collection: string;
  data: unknown;
  id?: string;
  timestamp: number;
}

const PENDING_OPERATIONS_KEY = 'pendingOperations';

export function useOfflineSync() {
  const isOnline = useNetwork();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const syncPendingOperations = async () => {
      if (!isOnline) return;

      try {
        setSyncing(true);
        const pendingOps = await localforage.getItem<PendingOperation[]>(PENDING_OPERATIONS_KEY) || [];

        if (pendingOps.length === 0) return;

        // Sort operations by timestamp
        pendingOps.sort((a, b) => a.timestamp - b.timestamp);

        for (const op of pendingOps) {
          try {
            if (op.type === 'create') {
              await addDoc(collection(db, op.collection), op.data);
            } else if (op.type === 'update' && op.id) {
              await updateDoc(doc(db, op.collection, op.id), op.data);
            }
          } catch (error) {
            console.error('Error syncing operation:', error);
          }
        }

        // Clear pending operations after successful sync
        await localforage.removeItem(PENDING_OPERATIONS_KEY);

        if (pendingOps.length > 0) {
          toast.success('Modifications synchronisées avec succès', {
            duration: 3000,
            position: 'top-center'
          });
        }
      } catch (error) {
        console.error('Error in sync process:', error);
        toast.error('Erreur lors de la synchronisation', {
          duration: 3000,
          position: 'top-center'
        });
      } finally {
        setSyncing(false);
      }
    };

    if (isOnline) {
      syncPendingOperations();
    }
  }, [isOnline]);

  const addPendingOperation = async (operation: Omit<PendingOperation, 'timestamp'>) => {
    try {
      const pendingOps = await localforage.getItem<PendingOperation[]>(PENDING_OPERATIONS_KEY) || [];
      pendingOps.push({ ...operation, timestamp: Date.now() });
      await localforage.setItem(PENDING_OPERATIONS_KEY, pendingOps);
    } catch (error) {
      console.error('Error adding pending operation:', error);
    }
  };

  return {
    syncing,
    addPendingOperation
  };
}