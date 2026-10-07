import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, UserPlus, FileText, X, AlertTriangle } from 'lucide-react';

export const PatientsView = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    bloodGroup: 'O+',
    allergies: '',
    chronicConditions: '',
    emergencyName: '',
    emergencyRel: '',
    emergencyPhone: ''
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients?search=${encodeURIComponent(search)}`);
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(s => s.trim()) : [],
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRel,
          phone: formData.emergencyPhone
        }
      };

      const res = await api.post('/patients', payload);
      if (res.success) {
        setShowModal(false);
        setFormData({
          fullName: '', dateOfBirth: '', gender: 'Male', phone: '', email: '',
          address: '', bloodGroup: 'O+', allergies: '', chronicConditions: '',
          emergencyName: '', emergencyRel: '', emergencyPhone: ''
        });
        fetchPatients();
      }
    } catch (err) {
      alert(err.message || 'Failed to register patient');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Patient Directory & EHR Records</h1>
          <p className="text-xs text-zinc-500">Manage patient intake, medical background, and emergency contact details.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
        >
          <UserPlus size={15} />
          Register New Patient
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by Patient Name, Code (PAT-...), Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-300 rounded text-xs focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
            <tr>
              <th className="p-3">Patient Code</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Gender / DOB</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Allergies</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">Loading patients...</td>
              </tr>
            ) : patients.length > 0 ? (
              patients.map((p) => (
                <tr key={p._id} className="hover:bg-zinc-50">
                  <td className="p-3 font-mono font-bold text-emerald-800">{p.patientCode}</td>
                  <td className="p-3 font-semibold text-zinc-900">{p.fullName}</td>
                  <td className="p-3 text-zinc-600">
                    {p.gender}, {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3 text-zinc-600">{p.phone}</td>
                  <td className="p-3 font-mono">
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-bold text-zinc-700">
                      {p.bloodGroup || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.allergies && p.allergies.length > 0 ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[11px] font-medium flex items-center gap-1 w-fit">
                        <AlertTriangle size={11} /> {p.allergies.join(', ')}
                      </span>
                    ) : (
                      <span className="text-zinc-400">None</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="px-2.5 py-1 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded text-xs font-semibold flex items-center gap-1.5 ml-auto"
                    >
                      <FileText size={13} /> View EHR
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">No patients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Register Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h2 className="text-base font-bold text-zinc-900">Register New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded"
                    placeholder="e.g. Alice Johnson"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded"
                    placeholder="+1 555-0199"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded"
                  placeholder="patient@example.com"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Known Allergies (Comma separated)</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded"
                  placeholder="e.g. Penicillin, Latex"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Chronic Conditions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.chronicConditions}
                  onChange={e => setFormData({ ...formData, chronicConditions: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded"
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                />
              </div>

              <div className="border-t border-zinc-200 pt-3">
                <div className="font-bold text-zinc-800 mb-2">Emergency Contact Information</div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={formData.emergencyName}
                    onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="p-2 border border-zinc-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={formData.emergencyRel}
                    onChange={e => setFormData({ ...formData, emergencyRel: e.target.value })}
                    className="p-2 border border-zinc-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.emergencyPhone}
                    onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="p-2 border border-zinc-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient EHR Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{selectedPatient.fullName}</h2>
                <div className="text-xs font-mono text-emerald-800">Patient Code: {selectedPatient.patientCode}</div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-800">
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded border border-zinc-200">
                <div><strong>DOB:</strong> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</div>
                <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                <div><strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'N/A'}</div>
              </div>

              <div>
                <strong>Allergies:</strong>{' '}
                {selectedPatient.allergies?.length > 0 ? (
                  <span className="text-amber-800 font-semibold">{selectedPatient.allergies.join(', ')}</span>
                ) : (
                  <span className="text-zinc-400">None reported</span>
                )}
              </div>

              <div>
                <strong>Chronic Conditions:</strong>{' '}
                {selectedPatient.chronicConditions?.length > 0 ? (
                  <span>{selectedPatient.chronicConditions.join(', ')}</span>
                ) : (
                  <span className="text-zinc-400">None</span>
                )}
              </div>

              {selectedPatient.emergencyContact?.name && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-900">
                  <div className="font-bold">Emergency Contact</div>
                  <div>{selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship}) - {selectedPatient.emergencyContact.phone}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-zinc-800 text-white rounded text-xs font-semibold"
              >
                Close EHR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
