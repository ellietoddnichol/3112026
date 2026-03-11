import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { parserApi, roomsApi } from '../../lib/api';
import type { Room, ParseLine } from '../../types';

interface Props {
  projectId: number;
}

export default function ParserWorkspace({ projectId }: Props) {
  const [text, setText] = useState('');
  const [parseResult, setParseResult] = useState<{ jobId: number; lines: ParseLine[] } | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [lineStatuses, setLineStatuses] = useState<Record<number, string>>({});
  const [finalized, setFinalized] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', projectId],
    queryFn: () => roomsApi.list(projectId),
  });

  const parseMutation = useMutation({
    mutationFn: parserApi.parseText,
    onSuccess: (data) => {
      setParseResult({ jobId: data.job.id, lines: data.lines });
      const statuses: Record<number, string> = {};
      data.lines.forEach((l: ParseLine) => { statuses[l.id] = l.reviewStatus; });
      setLineStatuses(statuses);
      setFinalized(false);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ jobId, roomId }: { jobId: number; roomId: number }) =>
      parserApi.finalize(jobId, projectId, roomId),
    onSuccess: () => setFinalized(true),
  });

  const handleParse = () => {
    if (!text.trim()) return;
    parseMutation.mutate({ text, projectId });
  };

  const handleFinalize = () => {
    if (!parseResult || !selectedRoomId) return;
    finalizeMutation.mutate({ jobId: parseResult.jobId, roomId: selectedRoomId });
  };

  const toggleStatus = (lineId: number, current: string) => {
    const next = current === 'accepted' ? 'rejected' : current === 'rejected' ? 'pending' : 'accepted';
    setLineStatuses(prev => ({ ...prev, [lineId]: next }));
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-500';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'accepted') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-500" />;
    return <AlertCircle size={16} className="text-yellow-500" />;
  };

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Takeoff Parser</h2>
      <p className="text-sm text-gray-500 mb-4">
        Paste your takeoff schedule below. The parser will identify items, match them to the catalog, and let you review before finalizing.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Takeoff Input</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={8}
          placeholder={`Paste your takeoff text here, one item per line. Example:\n2 EA Grab Bar 36" SS ADA\n1 EA Mirror 24x36\n4 EA Toilet Paper Dispenser Double Roll\n3 EA Soap Dispenser Surface Mount SS`}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleParse}
            disabled={!text.trim() || parseMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <FileText size={16} />
            {parseMutation.isPending ? 'Parsing...' : 'Parse Text'}
          </button>
        </div>
      </div>

      {parseResult && parseResult.lines.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Parsed Lines ({parseResult.lines.length} found)
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle size={12} className="text-green-500" /> Accepted
              <AlertCircle size={12} className="text-yellow-500" /> Pending
              <XCircle size={12} className="text-red-500" /> Rejected
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Raw Text</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unit</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Matched Item</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parseResult.lines.map(line => (
                <tr
                  key={line.id}
                  onClick={() => toggleStatus(line.id, lineStatuses[line.id] ?? line.reviewStatus)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    lineStatuses[line.id] === 'rejected' ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <StatusIcon status={lineStatuses[line.id] ?? line.reviewStatus} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-700 max-w-xs truncate">{line.rawText}</td>
                  <td className="px-3 py-2 text-right">{line.parsedQty}</td>
                  <td className="px-3 py-2 text-gray-500">{line.parsedUnit}</td>
                  <td className="px-3 py-2">
                    {line.matchedCatalogItemId ? (
                      <span className="text-green-700 text-xs">{line.normalizedText.slice(0, 40)}</span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">No match</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`text-xs font-medium ${confidenceColor(line.confidenceScore)}`}>
                      {Math.round(line.confidenceScore * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {parseResult && !finalized && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Finalize to Room</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedRoomId ?? ''}
              onChange={e => setSelectedRoomId(parseInt(e.target.value) || null)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select room...</option>
              {(rooms as Room[]).map(r => <option key={r.id} value={r.id}>{r.roomName}</option>)}
            </select>
            <button
              onClick={handleFinalize}
              disabled={!selectedRoomId || finalizeMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Send size={16} />
              {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize Takeoff'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Click row to toggle accepted/rejected. Only accepted and pending lines will be added.
          </p>
        </div>
      )}

      {finalized && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
          <CheckCircle className="inline mr-2" size={16} />
          Takeoff lines have been added to the project! Switch to the Takeoff tab to review.
        </div>
      )}
    </div>
  );
}
