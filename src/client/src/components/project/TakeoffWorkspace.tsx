import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Copy, Edit2, Check, X, Package } from 'lucide-react';
import { roomsApi, projectsApi } from '../../lib/api';
import type { Project, Room } from '../../types';
import TakeoffTable from './TakeoffTable';
import AddLineModal from './AddLineModal';
import BundlePickerModal from './BundlePickerModal';

interface Props {
  projectId: number;
  project: Project;
}

export default function TakeoffWorkspace({ projectId, project }: Props) {
  const qc = useQueryClient();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [showAddLine, setShowAddLine] = useState(false);
  const [showBundlePicker, setShowBundlePicker] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showNewRoom, setShowNewRoom] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', projectId],
    queryFn: () => roomsApi.list(projectId),
  });

  const { data: summary } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: () => projectsApi.getSummary(projectId),
  });

  const currentRoomId = activeRoomId ?? (rooms[0]?.id ?? null);

  const createRoom = useMutation({
    mutationFn: roomsApi.create,
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms', projectId] });
      setActiveRoomId(room.id);
      setNewRoomName('');
      setShowNewRoom(false);
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Room> }) => roomsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', projectId] });
      setEditingRoomId(null);
    },
  });

  const deleteRoom = useMutation({
    mutationFn: roomsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', projectId] });
      qc.invalidateQueries({ queryKey: ['takeoff', projectId] });
      setActiveRoomId(null);
    },
  });

  const duplicateRoom = useMutation({
    mutationFn: roomsApi.duplicate,
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms', projectId] });
      qc.invalidateQueries({ queryKey: ['takeoff', projectId] });
      setActiveRoomId(room.id);
    },
  });

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    createRoom.mutate({ projectId, roomName: newRoomName.trim(), sortOrder: rooms.length });
  };

  const handleRenameRoom = (room: Room) => {
    if (!editingRoomName.trim()) return;
    updateRoom.mutate({ id: room.id, data: { ...room, roomName: editingRoomName } });
  };

  const handleDeleteRoom = (roomId: number) => {
    if (confirm('Delete this room and all its takeoff lines?')) {
      deleteRoom.mutate(roomId);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col h-full">
      {/* Room tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(rooms as Room[]).map(room => (
            <div key={room.id} className="flex items-center group">
              {editingRoomId === room.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingRoomName}
                    onChange={e => setEditingRoomName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameRoom(room);
                      if (e.key === 'Escape') setEditingRoomId(null);
                    }}
                    className="border border-blue-400 rounded px-2 py-1 text-sm w-32 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => handleRenameRoom(room)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingRoomId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveRoomId(room.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    currentRoomId === room.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {room.roomName}
                  <span className="hidden group-hover:flex items-center gap-1 ml-1">
                    <Edit2
                      size={12}
                      onClick={e => { e.stopPropagation(); setEditingRoomId(room.id); setEditingRoomName(room.roomName); }}
                      className="hover:text-blue-300"
                    />
                    <Copy
                      size={12}
                      onClick={e => { e.stopPropagation(); duplicateRoom.mutate(room.id); }}
                      className="hover:text-blue-300"
                    />
                    <Trash2
                      size={12}
                      onClick={e => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                      className="hover:text-red-300"
                    />
                  </span>
                </button>
              )}
            </div>
          ))}

          {showNewRoom ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddRoom(); if (e.key === 'Escape') setShowNewRoom(false); }}
                placeholder="Room name..."
                className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button onClick={handleAddRoom} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
              <button onClick={() => setShowNewRoom(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewRoom(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-dashed border-gray-300"
            >
              <Plus size={14} /> Add Room
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {currentRoomId && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2">
          <button
            onClick={() => setShowAddLine(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus size={15} /> Add Line
          </button>
          <button
            onClick={() => setShowBundlePicker(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
          >
            <Package size={15} /> Apply Bundle
          </button>
        </div>
      )}

      {/* Takeoff table */}
      <div className="flex-1 overflow-auto p-6">
        {rooms.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No rooms yet. Add a room to start your takeoff.</p>
          </div>
        ) : currentRoomId ? (
          <TakeoffTable projectId={projectId} roomId={currentRoomId} project={project} />
        ) : null}

        {/* Summary */}
        {summary && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Material</div>
                <div className="text-lg font-bold text-gray-900">{fmt(summary.materialTotal)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Labor</div>
                <div className="text-lg font-bold text-gray-900">{fmt(summary.laborTotal)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Overhead + Profit</div>
                <div className="text-lg font-bold text-gray-900">{fmt(summary.overhead + summary.profit)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">GRAND TOTAL</div>
                <div className="text-xl font-bold text-blue-700">{fmt(summary.grandTotal)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddLine && currentRoomId && (
        <AddLineModal
          projectId={projectId}
          roomId={currentRoomId}
          onClose={() => setShowAddLine(false)}
        />
      )}

      {showBundlePicker && currentRoomId && (
        <BundlePickerModal
          projectId={projectId}
          roomId={currentRoomId}
          onClose={() => setShowBundlePicker(false)}
        />
      )}
    </div>
  );
}
