"use client";

import { useState, useEffect } from "react";
import { Plus, X, Edit, Trash2, TestTube, CheckCircle2, XCircle } from "lucide-react";
import { addConfig, updateConfig, deleteConfig, updateTestResult } from "@/app/actions/configs";

export default function ConfigList({ configs }: { configs: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    domain: "",
    store_selector: "",
    username_selector: "",
    password_selector: "",
    login_button_selector: "",
    auto_submit: true,
    is_active: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'PORTAL_TEST_RESULTS') {
        const { configId, result } = event.data.data;
        if (configId) {
          showToast("Test complete, updating database...");
          await updateTestResult(configId, result);
          window.location.reload();
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setCurrentVersion(1);
    setFormData({ 
      domain: "", 
      store_selector: "", 
      username_selector: "input[type='email'], input[name*='email'], input[id*='email'], input[name*='user'], input[id*='user']", 
      password_selector: "input[type='password']", 
      login_button_selector: "button[type='submit']",
      auto_submit: true,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cfg: any) => {
    setEditingId(cfg.id);
    setCurrentVersion(cfg.config_version || 1);
    setFormData({
      domain: cfg.domain,
      store_selector: cfg.store_selector || "",
      username_selector: cfg.username_selector || "",
      password_selector: cfg.password_selector || "",
      login_button_selector: cfg.login_button_selector || "",
      auto_submit: cfg.auto_submit !== false,
      is_active: cfg.is_active !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingId) {
        res = await updateConfig(editingId, formData, currentVersion);
      } else {
        res = await addConfig(formData);
      }
      
      if (res.error) {
        showToast("Error saving config: " + res.error);
      } else {
        setIsModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      showToast("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    try {
      const res = await deleteConfig(id);
      if (res.error) {
        showToast("Error deleting: " + res.error);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      showToast("Error: " + err.message);
    }
  };

  const handleTestConfig = (cfg: any) => {
    const url = `https://${cfg.domain}`;
    
    // Send message to extension to start testing
    window.postMessage({
      type: 'PORTAL_AUTO_LOGIN',
      data: {
        action: "TEST",
        configId: cfg.id, // Used by extension to return result
        website: url,
        selectors: {
          store: cfg.store_selector,
          username: cfg.username_selector,
          password: cfg.password_selector,
          login: cfg.login_button_selector
        },
        configVersion: cfg.config_version || 1
      }
    }, '*');
    
    window.open(url, "_blank");
    showToast("Đã gửi lệnh Test sang Extension!");
  };

  return (
    <div>
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-down">
          {toastMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Site Configurations</h2>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Config
        </button>
      </div>

      <div className="space-y-4">
        {configs.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed">
            <p className="text-lg font-medium">No site configurations yet</p>
            <p className="text-sm">Smart Fallback will be used for all sites.</p>
          </div>
        )}
        
        {configs.map((cfg) => (
          <div key={cfg.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 ${!cfg.is_active ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  {cfg.domain}
                  {!cfg.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase font-bold">Inactive</span>}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">v{cfg.config_version || 1}</span>
                </h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleTestConfig(cfg)} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                  <TestTube className="w-4 h-4" /> Test
                </button>
                <button onClick={() => handleOpenEdit(cfg)} className="text-gray-400 hover:text-blue-500 p-1.5">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cfg.id)} className="text-gray-400 hover:text-red-500 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
               <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                 <span className="text-gray-500 block mb-1 font-semibold">Store Selector</span>
                 <code className="text-blue-600 dark:text-blue-400 break-all">{cfg.store_selector || "N/A"}</code>
               </div>
               <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                 <span className="text-gray-500 block mb-1 font-semibold">Username Selector</span>
                 <code className="text-green-600 dark:text-green-400 break-all">{cfg.username_selector || "N/A"}</code>
               </div>
               <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                 <span className="text-gray-500 block mb-1 font-semibold">Password Selector</span>
                 <code className="text-purple-600 dark:text-purple-400 break-all">{cfg.password_selector || "N/A"}</code>
               </div>
               <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                 <span className="text-gray-500 block mb-1 font-semibold">Login Btn Selector</span>
                 <code className="text-orange-600 dark:text-orange-400 break-all">{cfg.login_button_selector || "N/A"}</code>
               </div>
            </div>

            {cfg.last_test_result && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex justify-between">
                  <span>Last Test Result</span>
                  <span>{new Date(cfg.last_tested_at).toLocaleString()}</span>
                </div>
                <div className="flex gap-4">
                  {Object.entries(cfg.last_test_result).map(([key, found]: any) => (
                    <div key={key} className="flex items-center gap-1.5 text-sm">
                      {found ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{editingId ? "Edit Config" : "Add New Config"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain (e.g. posspa.dichvupro.net)</label>
                <input 
                  type="text" required
                  value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Selector (Optional)</label>
                <input 
                  type="text" 
                  value={formData.store_selector} onChange={(e) => setFormData({...formData, store_selector: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username Selector</label>
                <input 
                  type="text" required
                  value={formData.username_selector} onChange={(e) => setFormData({...formData, username_selector: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Selector</label>
                <input 
                  type="text" required
                  value={formData.password_selector} onChange={(e) => setFormData({...formData, password_selector: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login Button Selector</label>
                <input 
                  type="text" required
                  value={formData.login_button_selector} onChange={(e) => setFormData({...formData, login_button_selector: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.auto_submit} onChange={(e) => setFormData({...formData, auto_submit: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Submit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Save Config"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
