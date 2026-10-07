import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Printer, Trash2, X, Stethoscope, Building2 } from 'lucide-react';

export const PrescriptionsView = () => {
  const { user, activeClinic } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);

  // Form State
  const [selectedAptId, setSelectedAptId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '1-0-1 (After Meals)', duration: '7 Days', instructions: '' }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rxRes, aptRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/appointments?status=IN_CONSULTATION')
      ]);

      if (rxRes.success) setPrescriptions(rxRes.data);
      if (aptRes.success) setAppointments(aptRes.data);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '1-0-1 (After Meals)', duration: '7 Days', instructions: '' }]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedApt = appointments.find(a => a._id === selectedAptId);
    if (!selectedApt) {
      alert('Please select an active consultation appointment.');
      return;
    }

    try {
      const res = await api.post('/prescriptions', {
        appointmentId: selectedAptId,
        patientId: selectedApt.patientId._id,
        diagnosis,
        medicines,
        generalInstructions,
        followUpDate
      });

      if (res.success) {
        setShowModal(false);
        setDiagnosis('');
        setGeneralInstructions('');
        setFollowUpDate('');
        setMedicines([{ name: '', dosage: '', frequency: '1-0-1 (After Meals)', duration: '7 Days', instructions: '' }]);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to issue prescription.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Digital Electronic Prescriptions</h1>
          <p className="text-xs text-zinc-500">Issue structured e-prescriptions, medicine dosage schedules, and printable clinic records.</p>
        </div>

        {(user?.role === 'DOCTOR' || user?.role === 'CLINIC_ADMIN') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
          >
            <Plus size={15} />
            Issue Digital Prescription
          </button>
        )}
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
            <tr>
              <th className="p-3">Rx Code</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Prescribing Doctor</th>
              <th className="p-3">Diagnosis</th>
              <th className="p-3">Medicines Count</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">Loading prescriptions...</td>
              </tr>
            ) : prescriptions.length > 0 ? (
              prescriptions.map((rx) => (
                <tr key={rx._id} className="hover:bg-zinc-50">
                  <td className="p-3 font-mono font-bold text-emerald-800">{rx.prescriptionCode}</td>
                  <td className="p-3 font-semibold text-zinc-900">{rx.patientId?.fullName || 'Patient'}</td>
                  <td className="p-3 text-zinc-700">{rx.doctorId?.name || 'Doctor'}</td>
                  <td className="p-3 max-w-xs truncate font-medium">{rx.diagnosis}</td>
                  <td className="p-3 font-mono font-semibold text-zinc-700">{rx.medicines?.length || 0} Line Items</td>
                  <td className="p-3 font-mono text-zinc-500">{new Date(rx.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedRx(rx)}
                      className="px-2.5 py-1 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded text-xs font-semibold flex items-center gap-1.5 ml-auto"
                    >
                      <Printer size={13} /> View & Print Rx
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">No digital prescriptions issued yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Stethoscope size={18} className="text-emerald-700" /> Issue Digital Prescription
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-zinc-700 block mb-1">Select Consultation Appointment *</label>
                <select
                  required
                  value={selectedAptId}
                  onChange={e => setSelectedAptId(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded"
                >
                  <option value="">-- Choose Active Consultation --</option>
                  {appointments.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.patientId?.fullName} (Q#{a.queueNumber} - {a.reasonForVisit || 'Consultation'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Diagnosis / Clinical Impression *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded"
                  placeholder="e.g. Acute Bronchitis, Essential Hypertension"
                />
              </div>

              {/* Dynamic Medicine Rows */}
              <div className="space-y-2 border-t border-zinc-200 pt-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-800">Prescribed Medications</label>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-emerald-700 hover:underline font-semibold text-[11px] flex items-center gap-1"
                  >
                    + Add Medicine Line
                  </button>
                </div>

                {medicines.map((med, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Medicine Name (e.g. Amoxicillin)"
                        value={med.name}
                        onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                        className="p-1.5 border border-zinc-300 rounded col-span-2"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Dosage (e.g. 500mg)"
                        value={med.dosage}
                        onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                        className="p-1.5 border border-zinc-300 rounded"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Duration (e.g. 7 Days)"
                        value={med.duration}
                        onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                        className="p-1.5 border border-zinc-300 rounded"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <select
                        value={med.frequency}
                        onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                        className="p-1.5 border border-zinc-300 rounded"
                      >
                        <option value="1-0-1 (After Meals)">1-0-1 (After Meals)</option>
                        <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                        <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                        <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                        <option value="As Needed (PRN)">As Needed (PRN)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Special instructions (e.g. Take after food)"
                        value={med.instructions}
                        onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                        className="p-1.5 border border-zinc-300 rounded col-span-1"
                      />
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center justify-end"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">General Dietary / Lifestyle Advice</label>
                  <textarea
                    rows="2"
                    value={generalInstructions}
                    onChange={e => setGeneralInstructions(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded"
                    placeholder="e.g. Drink plenty of water, rest for 3 days."
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Follow-up Review Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
                >
                  Issue Digital Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {selectedRx && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-2xl p-8 space-y-6">
            {/* Header Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-4">
              <div>
                <h1 className="text-xl font-bold text-emerald-900 tracking-tight flex items-center gap-2">
                  <Building2 size={20} className="text-emerald-700" />
                  {activeClinic?.name || 'Apex Health Clinic'}
                </h1>
                <div className="text-xs text-zinc-600 mt-1">{activeClinic?.address || 'Medical Suite 100'}</div>
                <div className="text-xs text-zinc-500 font-mono">{activeClinic?.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold font-mono text-emerald-800">{selectedRx.prescriptionCode}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">Date: {new Date(selectedRx.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Patient & Doctor details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-3 border border-zinc-200 rounded">
              <div>
                <div><strong>PATIENT NAME:</strong> {selectedRx.patientId?.fullName}</div>
                <div><strong>GENDER / DOB:</strong> {selectedRx.patientId?.gender}, {selectedRx.patientId?.dateOfBirth ? new Date(selectedRx.patientId.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                <div><strong>BLOOD GROUP:</strong> {selectedRx.patientId?.bloodGroup || 'N/A'}</div>
              </div>
              <div>
                <div><strong>PRESCRIBING DOCTOR:</strong> Dr. {selectedRx.doctorId?.name}</div>
                <div><strong>SPECIALIZATION:</strong> {selectedRx.doctorId?.specialization}</div>
                <div><strong>CLINICAL DIAGNOSIS:</strong> <span className="font-semibold text-emerald-900">{selectedRx.diagnosis}</span></div>
              </div>
            </div>

            {/* Rx Symbol & Medicine Table */}
            <div>
              <div className="text-2xl font-serif font-bold text-emerald-800 mb-2">Rx</div>
              <table className="w-full text-left text-xs border border-zinc-300">
                <thead className="bg-zinc-100 border-b border-zinc-300 font-bold">
                  <tr>
                    <th className="p-2 border-r border-zinc-300">Medicine Name</th>
                    <th className="p-2 border-r border-zinc-300">Dosage</th>
                    <th className="p-2 border-r border-zinc-300">Frequency</th>
                    <th className="p-2 border-r border-zinc-300">Duration</th>
                    <th className="p-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-300">
                  {selectedRx.medicines?.map((m, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-zinc-300 font-bold text-zinc-900">{m.name}</td>
                      <td className="p-2 border-r border-zinc-300 font-mono">{m.dosage}</td>
                      <td className="p-2 border-r border-zinc-300 font-medium">{m.frequency}</td>
                      <td className="p-2 border-r border-zinc-300">{m.duration}</td>
                      <td className="p-2 text-zinc-600">{m.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* General Advice & Follow-up */}
            {selectedRx.generalInstructions && (
              <div className="text-xs bg-zinc-50 p-3 rounded border border-zinc-200">
                <strong>General Advice:</strong> {selectedRx.generalInstructions}
              </div>
            )}

            <div className="flex justify-between items-end pt-6 border-t border-zinc-200 text-xs">
              <div>
                {selectedRx.followUpDate && (
                  <div><strong>Follow-up Date:</strong> {selectedRx.followUpDate}</div>
                )}
              </div>
              <div className="text-center font-mono">
                <div className="border-b border-zinc-400 w-36 mb-1"></div>
                <div>Doctor's Signature</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 no-print">
              <button
                onClick={() => setSelectedRx(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-xs text-zinc-700"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Digital Rx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
