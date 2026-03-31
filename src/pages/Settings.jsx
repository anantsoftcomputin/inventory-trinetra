import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { signUp, changePassword, getCurrentUser } from '../firebase/authService';
import toast from 'react-hot-toast';

const TABS = ['Store Info', 'Invoice Settings', 'Tag Code Reference', 'User Management'];
const CIPHER = [['0','E'],['1','B'],['2','V'],['3','K'],['4','W'],['5','T'],['6','G'],['7','A'],['8','S'],['9','P']];

function Field({ label, name, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

export default function AppSettings() {
  const [tab, setTab] = useState(0);
  const [store, setStore] = useState({
    storeName: 'TRINETRA FASHION STUDIO',
    tagline: 'Embroidery Artist & Fashion Designer',
    address: '',
    mobile: '',
    mobile2: '',
    email: '',
    website: '',
    gstin: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    accountName: '',
    upiId: '',
    termsAndConditions: 'No exchange / return after leaving the shop.',
    invoicePrefix: 'TRN',
    lowStockThreshold: 3,
  });
  const [loadingStore, setLoadingStore] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '' });
  const [addingUser, setAddingUser] = useState(false);
  const [pwdChange, setPwdChange] = useState({ current: '', next: '' });
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'store_settings'));
        if (snap.exists()) setStore(s => ({ ...s, ...snap.data() }));
      } catch { }
      setLoadingStore(false);
    }
    loadStore();
  }, []);

  function handleStoreChange(e) {
    const { name, value } = e.target;
    setStore(s => ({ ...s, [name]: value }));
  }

  async function saveStore() {
    setSavingStore(true);
    try {
      await setDoc(doc(db, 'settings', 'store_settings'), store, { merge: true });
      toast.success('Store settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingStore(false);
    }
  }

  async function addUser() {
    if (!newUser.email || !newUser.password) return toast.error('Email and password required');
    setAddingUser(true);
    try {
      await signUp(newUser.email, newUser.password);
      toast.success('Staff account created');
      setNewUser({ email: '', password: '', displayName: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  }

  async function handleChangePassword() {
    if (!pwdChange.next || pwdChange.next.length < 6) return toast.error('New password must be 6+ characters');
    setChangingPwd(true);
    try {
      await changePassword(pwdChange.current, pwdChange.next);
      toast.success('Password changed');
      setPwdChange({ current: '', next: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPwd(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === i ? 'border-amber-500 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loadingStore && tab === 0 ? (
        <div className="py-20 text-center text-gray-400">Loading...</div>
      ) : (
        <>
          {/* TAB 1: Store Info */}
          {tab === 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              <h3 className="font-semibold text-gray-800">Store Information</h3>
              <p className="text-sm text-gray-500">This information appears on every generated invoice.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Store Name" name="storeName" value={store.storeName} onChange={handleStoreChange} />
                <Field label="Tagline / Designation" name="tagline" value={store.tagline} onChange={handleStoreChange} />
                <div className="md:col-span-2">
                  <Field label="Address" name="address" value={store.address} onChange={handleStoreChange} placeholder="Full address as on invoice" />
                </div>
                <Field label="Primary Mobile" name="mobile" value={store.mobile} onChange={handleStoreChange} />
                <Field label="Secondary Mobile" name="mobile2" value={store.mobile2} onChange={handleStoreChange} />
                <Field label="Email" name="email" type="email" value={store.email} onChange={handleStoreChange} />
                <Field label="Website" name="website" value={store.website} onChange={handleStoreChange} />
                <Field label="GSTIN" name="gstin" value={store.gstin} onChange={handleStoreChange} />
              </div>

              <hr className="border-gray-200" />
              <h4 className="font-medium text-gray-700">Bank / Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Bank Name" name="bankName" value={store.bankName} onChange={handleStoreChange} />
                <Field label="Account Name" name="accountName" value={store.accountName} onChange={handleStoreChange} />
                <Field label="Account No." name="accountNo" value={store.accountNo} onChange={handleStoreChange} />
                <Field label="IFSC Code" name="ifsc" value={store.ifsc} onChange={handleStoreChange} />
                <Field label="UPI ID" name="upiId" value={store.upiId} onChange={handleStoreChange} />
              </div>

              <hr className="border-gray-200" />
              <h4 className="font-medium text-gray-700">Terms & Conditions</h4>
              <div>
                <textarea
                  name="termsAndConditions"
                  value={store.termsAndConditions}
                  onChange={handleStoreChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={saveStore}
                disabled={savingStore}
                className="bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingStore ? 'Saving...' : 'Save Store Settings'}
              </button>
            </div>
          )}

          {/* TAB 2: Invoice Settings */}
          {tab === 1 && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              <h3 className="font-semibold text-gray-800">Invoice Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Invoice Prefix" name="invoicePrefix" value={store.invoicePrefix} onChange={handleStoreChange} placeholder="TRN" />
                <Field label="Low Stock Threshold" name="lowStockThreshold" type="number" value={store.lowStockThreshold} onChange={handleStoreChange} placeholder="3" />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
                <strong>Note:</strong> Invoice counter is managed automatically via Firestore transactions. Changing the prefix will affect new invoices only. The current counter can be viewed/reset directly in the Firestore console at <code>settings/store_settings.invoiceCounter</code>.
              </div>
              <button
                onClick={saveStore}
                disabled={savingStore}
                className="bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingStore ? 'Saving...' : 'Save Invoice Settings'}
              </button>
            </div>
          )}

          {/* TAB 3: Tag Code Reference */}
          {tab === 2 && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Tag Code Cipher Reference</h3>
              <p className="text-sm text-gray-500">This is the internal cipher used to encode cost prices on product tags. Do not share with customers.</p>
              <table className="w-full max-w-xs text-center border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-950 text-white">
                    <th className="px-6 py-3 rounded-tl-lg">Digit</th>
                    <th className="px-6 py-3 rounded-tr-lg">Letter</th>
                  </tr>
                </thead>
                <tbody>
                  {CIPHER.map(([d, l]) => (
                    <tr key={d} className="border-t border-gray-200 even:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xl font-bold text-gray-800">{d}</td>
                      <td className="px-6 py-3 font-mono text-2xl font-bold text-amber-600 tracking-widest">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Example:</strong> ₹8,650 → <strong>SGTE</strong>&nbsp; (8=S, 6=G, 5=T, 0=E)
              </div>
            </div>
          )}

          {/* TAB 4: User Management */}
          {tab === 3 && (
            <div className="space-y-6">
              {/* Current User */}
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Change Your Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <Field label="Current Password" name="current" type="password" value={pwdChange.current} onChange={e => setPwdChange(p => ({ ...p, current: e.target.value }))} />
                  <Field label="New Password" name="next" type="password" value={pwdChange.next} onChange={e => setPwdChange(p => ({ ...p, next: e.target.value }))} />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPwd}
                  className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {changingPwd ? 'Updating...' : 'Change Password'}
                </button>
              </div>

              {/* Add Staff */}
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Add Staff Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                  <Field label="Email" name="email" type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="staff@example.com" />
                  <Field label="Password (min 6 chars)" name="password" type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
                </div>
                <button
                  onClick={addUser}
                  disabled={addingUser}
                  className="bg-amber-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {addingUser ? 'Creating...' : 'Create Staff Account'}
                </button>
                <p className="text-xs text-gray-400">Note: Creating a new Firebase Auth user may sign you out in some browser configurations. Use the Firebase console for bulk user creation.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
