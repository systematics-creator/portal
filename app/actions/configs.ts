'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addConfig(data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const response = await supabase.from('site_configs').insert({
      domain: data.domain,
      store_selector: data.store_selector || null,
      username_selector: data.username_selector,
      password_selector: data.password_selector,
      login_button_selector: data.login_button_selector,
      auto_submit: data.auto_submit,
      is_active: data.is_active,
      config_version: 1
    }).select();

    if (response.error) return { error: response.error.message }
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/configs')
    return { success: true, dbResponse: response }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function updateConfig(id: string, data: any, currentVersion: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const payload = {
      domain: data.domain,
      store_selector: data.store_selector || null,
      username_selector: data.username_selector,
      password_selector: data.password_selector,
      login_button_selector: data.login_button_selector,
      auto_submit: data.auto_submit,
      is_active: data.is_active,
      config_version: currentVersion + 1,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('site_configs').update(payload).eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/configs')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function deleteConfig(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase.from('site_configs').delete().eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/configs')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function updateTestResult(id: string, result: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const payload = {
      last_test_result: result,
      last_tested_at: new Date().toISOString()
    }

    const { error } = await supabase.from('site_configs').update(payload).eq('id', id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard/configs')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}
