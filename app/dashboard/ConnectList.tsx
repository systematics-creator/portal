"use client";

import { useState } from "react";
import { Link2, Plus, ExternalLink, Activity, PowerOff, X, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnectList({ connections, allApps, userId }: { connections: any[], allApps: any[], userId: string }) {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [registeringApp, setRegisteringApp] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    app_id: allApps.length > 0 ? allApps[0].id : "",
    display_name: "",
    username: "",
    store_code: ""
  });

  const [appFormData, setAppFormData] = useState({
    name: "",
    website: "https://",
    app_code: ""
  });

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringApp(true);
    try {
      const { error } = await supabase.from('apps').insert({
        name: appFormData.name,
        website: appFormData.website,
        app_code: appFormData.app_code.toUpperCase()
      });
      if (error) throw error;
      
      setIsAppModalOpen(false);
      setAppFormData({ name: "", website: "https://", app_code: "" });
      router.refresh(); 
    } catch (err: any) {
      alert("Failed to register app: " + err.message);
    } finally {
      setRegisteringApp(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const { error } = await supabase.from('user_connections').insert({
        user_id: userId,
        app_id: formData.app_id,
        display_name: formData.display_name,
        username: formData.username,
        store_code: formData.store_code || null,
        is_active: true,
        connection_version: 1
      });
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ app_id: allApps[0]?.id || "", display_name: "", username: "", store_code: "" });
      router.refresh();
    } catch (err: any) {
      alert("Failed to add connection: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleConnect = async (conn: any) => {
    setConnectingId(conn.id);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: conn.id }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");

      // We have the token and the target website
      // Create a hidden form and submit it to target website's /autologin
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${conn.apps.website}/autologin`;

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = data.token;
      
      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your App Connections</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAppModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Globe className="w-5 h-5" />
            Register App
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Connection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <Link2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-lg font-medium">No connections yet</p>
            <p className="text-sm">Click "Add Connection" to link your first app.</p>
          </div>
        )}
        
        {connections.map((conn) => (
          <div key={conn.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                    {conn.apps.app_code.substring(0, 2)}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{conn.apps.name}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">{conn.display_name || conn.apps.name}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  {conn.is_active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${conn.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {conn.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-grow space-y-3">
              <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                <span className="text-gray-500 dark:text-gray-400">Username:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{conn.username}</span>
              </div>
              {conn.store_code && (
                <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                  <span className="text-gray-500 dark:text-gray-400">Store Code:</span>
                  <span className="font-semibold text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs">{conn.store_code}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handleConnect(conn)}
                disabled={!conn.is_active || connectingId === conn.id}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {connectingId === conn.id ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : !conn.is_active ? (
                  <PowerOff className="w-5 h-5" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                {connectingId === conn.id ? "Connecting..." : !conn.is_active ? "Connection Disabled" : "Connect Now"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Add New Connection</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddConnection} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select App</label>
                <select 
                  required
                  value={formData.app_id}
                  onChange={(e) => setFormData({...formData, app_id: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {allApps.map(app => (
                    <option key={app.id} value={app.id}>{app.name} ({app.app_code})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Spa Branch 1"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  placeholder="admin"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Code (Optional)</label>
                <input 
                  type="text" 
                  placeholder="SPA001"
                  value={formData.store_code}
                  onChange={(e) => setFormData({...formData, store_code: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={adding}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {adding ? "Saving..." : "Save Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register App Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Register New App</h3>
              <button onClick={() => setIsAppModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterApp} className="p-5 space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                <strong>Note:</strong> After registering, you must configure a secret API Key for this app on your Vercel Dashboard (e.g. <code>[APP_CODE]_API_KEY</code>).
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. PosSpa"
                  value={appFormData.name}
                  onChange={(e) => setAppFormData({...appFormData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://posspa.dichvupro.com"
                  value={appFormData.website}
                  onChange={(e) => setAppFormData({...appFormData, website: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Code (Uppercase)</label>
                <input 
                  type="text" 
                  required
                  placeholder="POSSPA"
                  value={appFormData.app_code}
                  onChange={(e) => setAppFormData({...appFormData, app_code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAppModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={registeringApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {registeringApp ? "Saving..." : "Register App"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
