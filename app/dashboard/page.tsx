import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConnectList from "./ConnectList";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch connections
  const { data: connections, error } = await supabase
    .from("user_connections")
    .select(`
      id,
      display_name,
      website,
      store_code,
      username,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">P</div>
             <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">SSO Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">{user.email}</span>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
            <form action="/auth/signout" method="post">
               <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1 transition-colors">
                 <LogOut className="w-4 h-4" />
                 <span className="hidden sm:inline">Sign out</span>
               </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error fetching data: </strong>
            <span className="block sm:inline">{error.message}</span>
          </div>
        )}
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-400 rounded text-sm font-mono overflow-auto">
          <strong>DEBUG INFO:</strong><br/>
          User ID: {user.id}<br/>
          Connections Count: {connections?.length || 0}<br/>
          Raw Error: {JSON.stringify(error)}<br/>
        </div>

        <ConnectList connections={connections || []} />
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
         &copy; {new Date().getFullYear()} SSO Portal. All rights reserved.
      </footer>
    </div>
  );
}
