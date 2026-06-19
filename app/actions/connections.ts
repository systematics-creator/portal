'use server'

import { createClient } from "@/lib/supabase/server"
import { encrypt, decrypt } from "@/lib/crypto"
import { revalidatePath } from "next/cache"

export async function addConnection(data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const response = await supabase.from('user_connections').insert({
      user_id: user.id,
      display_name: data.display_name,
      website: data.website,
      store_code: data.store_code || null,
      username: data.username,
      password_encrypted: encrypt(data.password)
    }).select();

    if (response.error) return { error: response.error.message }
    
    revalidatePath('/dashboard')
    return { success: true, dbResponse: response }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function updateConnection(id: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const payload: any = {
      display_name: data.display_name,
      website: data.website,
      store_code: data.store_code || null,
      username: data.username,
    }

    if (data.password) {
      payload.password_encrypted = encrypt(data.password)
    }

    const { error } = await supabase.from('user_connections').update(payload).eq('id', id).eq('user_id', user.id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function deleteConnection(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase.from('user_connections').delete().eq('id', id).eq('user_id', user.id)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" }
  }
}

export async function getConnectionPassword(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { data, error } = await supabase.from('user_connections').select('password_encrypted').eq('id', id).eq('user_id', user.id).single()

    if (error || !data) return { error: "Connection not found" }
    
    return { data: decrypt(data.password_encrypted) }
  } catch (err: any) {
    return { error: err.message || "Failed to decrypt password" }
  }
}
