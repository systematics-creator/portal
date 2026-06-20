"use client";

import { useState, useEffect } from "react";
import { Plus, ExternalLink, X, Copy, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { addConnection, updateConnection, deleteConnection, getConnectionPassword } from "@/app/actions/connections";

export default function ConnectList({ connections, siteConfigs = [] }: { connections: any[], siteConfigs?: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<any>(null);
  const [decryptedPassword, setDecryptedPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("portal_active_app");
    if (saved) setActiveAppId(saved);
  }, []);

  const [formData, setFormData] = useState({
    display_name: "",
    website: "https://",
    store_code: "",
    username: "",
    password: ""
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ display_name: "", website: "https://", store_code: "", username: "", password: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (conn: any) => {
    setEditingId(conn.id);
    setFormData({
      display_name: conn.display_name,
      website: conn.website,
      store_code: conn.store_code || "",
      username: conn.username,
      password: "" // Blank by default, only update if user types something
    });
    setIsModalOpen(true);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingId) {
        res = await updateConnection(editingId, formData);
      } else {
        res = await addConnection(formData);
      }
      
      if (res.error) {
        showToast("Error saving app: " + res.error);
        console.error("Save error:", res.error);
      } else {
        console.log("Save Success. Response:", res);
        setIsModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      showToast("Error saving app: " + err.message);
      console.error("Save exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) return;
    try {
      const res = await deleteConnection(id);
      if (res.error) {
        showToast("Error deleting connection: " + res.error);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      showToast("Error deleting connection: " + err.message);
    }
  };

  const handleConnect = async (conn: any) => {
    try {
      // 1. Fetch password first
      const res = await getConnectionPassword(conn.id);
      if (res.error) {
        showToast("Lỗi khi lấy mật khẩu: " + res.error);
        return;
      }

      // Extract domain
      let domain = "";
      try {
        domain = new URL(conn.website).hostname;
      } catch (e) {
        domain = conn.website;
      }

      const config = siteConfigs.find((c: any) => {
        if (c.is_active === false) return false;
        let cDomain = c.domain;
        try {
          // If user accidentally put full URL or path in config
          cDomain = new URL(c.domain.startsWith('http') ? c.domain : `https://${c.domain}`).hostname;
        } catch (e) {}
        return domain === cDomain || domain.includes(cDomain);
      });

      let selectors = {};
      let autoSubmit = true;
      let configVersion = 1;

      if (config) {
        selectors = {
          store: config.store_selector,
          username: config.username_selector,
          password: config.password_selector,
          login: config.login_button_selector
        };
        autoSubmit = config.auto_submit !== false;
        configVersion = config.config_version || 1;
      } else {
        // Smart Fallback
        selectors = {
          store: "input[name*='store'], input[id*='store']",
          username: "input[type='email'], input[name*='email'], input[id*='email'], input[name*='user'], input[id*='user']",
          password: "input[type='password']",
          login: "button[type='submit']"
        };
      }

      // 2. Send message to Chrome Extension
      window.postMessage({
        type: 'PORTAL_AUTO_LOGIN',
        data: {
          action: "LOGIN",
          website: conn.website,
          credentials: {
            storeCode: conn.store_code,
            username: conn.username,
            password: res.data
          },
          selectors,
          autoSubmit,
          configVersion
        }
      }, '*');

      // 3. Mark as active
      localStorage.setItem("portal_active_app", conn.id);
      setActiveAppId(conn.id);

      // 4. Open website in new tab
      window.open(conn.website, "_blank");
      
      showToast("Đã mở ứng dụng và gửi lệnh tự động điền!");
    } catch (err: any) {
      showToast("Lỗi kết nối: " + err.message);
    }
  };

  const handleViewCredentials = async (conn: any) => {
    try {
      const res = await getConnectionPassword(conn.id);
      if (res.error) {
        showToast("Lỗi khi lấy mật khẩu: " + res.error);
        return;
      }
      setActiveConnection(conn);
      setDecryptedPassword(res.data!);
      setShowPassword(false);
      setIsCredsModalOpen(true);
    } catch (err: any) {
      showToast("Lỗi khi lấy mật khẩu: " + err.message);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label}`);
  };

  const handleCopyAll = () => {
    const text = `Store Code: ${activeConnection?.store_code || "N/A"}\nUsername: ${activeConnection?.username}\nPassword: ${decryptedPassword}`;
    navigator.clipboard.writeText(text);
    showToast("Copied all credentials");
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-down">
          {toastMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Apps</h2>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add App
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-lg font-medium">No connections yet</p>
            <p className="text-sm">Click "Add App" to securely store your logins.</p>
          </div>
        )}
        
        {connections.map((conn) => {
          const isActive = activeAppId === conn.id;
          return (
            <div key={conn.id} className={`rounded-lg shadow-sm border flex flex-col transition-all hover:shadow-md ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-400 dark:ring-emerald-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <div className={`p-3 border-b flex justify-between items-center ${isActive ? 'border-emerald-100 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-700'}`}>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate" title={conn.display_name}>{conn.display_name}</h3>
                </div>
                <div className="flex gap-1 items-center flex-shrink-0">
                  {isActive && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider mr-1">Active</span>}
                  <button onClick={() => handleOpenEdit(conn)} className="text-gray-400 hover:text-blue-500 transition-colors p-1" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(conn.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            
              <div className="p-3 flex-grow flex flex-col justify-center gap-2">
                <a href={conn.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block" title={conn.website}>{conn.website}</a>
                <div className="flex gap-2 text-xs overflow-hidden">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded flex-shrink-0 truncate max-w-[50%]">👤 {conn.username}</span>
                  {conn.store_code && <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex-shrink-0 truncate max-w-[50%]">🏠 {conn.store_code}</span>}
                </div>
              </div>

              <div className={`p-2 flex gap-2 border-t ${isActive ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800' : 'bg-gray-50/80 dark:bg-gray-800/80 border-gray-100 dark:border-gray-700'}`}>
                <button
                  onClick={() => handleConnect(conn)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 py-1.5 rounded-md font-medium text-sm transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Connect
                </button>
                <button
                  onClick={() => handleViewCredentials(conn)}
                  className={`flex items-center justify-center px-3 py-1.5 rounded-md transition-colors ${isActive ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-300 dark:hover:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                  title="View & Copy Credentials"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
        )})}
      </div>

      {/* Add/Edit Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{editingId ? "Edit App" : "Add New App"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveConnection} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Name</label>
                <input 
                  type="text" required placeholder="e.g. PosSpa Branch 1"
                  value={formData.display_name} onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                <input 
                  type="url" required placeholder="https://"
                  value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Code (Optional)</label>
                <input 
                  type="text" placeholder="SPA001"
                  value={formData.store_code} onChange={(e) => setFormData({...formData, store_code: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input 
                  type="text" required placeholder="admin"
                  value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password {editingId && <span className="text-xs text-gray-500 font-normal">(Leave blank to keep unchanged)</span>}</label>
                <input 
                  type="password" required={!editingId} placeholder="********"
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Save App"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {isCredsModalOpen && activeConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Ready to Login</h3>
              <button onClick={() => setIsCredsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {activeConnection.store_code && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Store Code</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={activeConnection.store_code} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 font-mono text-sm text-gray-900 dark:text-white" />
                    <button onClick={() => handleCopy(activeConnection.store_code, "Store Code")} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-md transition-colors"><Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Username</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={activeConnection.username} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 font-mono text-sm text-gray-900 dark:text-white" />
                  <button onClick={() => handleCopy(activeConnection.username, "Username")} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-md transition-colors"><Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? "text" : "password"} readOnly value={decryptedPassword} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md pl-3 pr-10 py-2 font-mono text-sm text-gray-900 dark:text-white" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={() => handleCopy(decryptedPassword, "Password")} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-md transition-colors"><Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleCopyAll} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
