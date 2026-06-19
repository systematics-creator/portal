'use server'

import { createClient } from "@/lib/supabase/server"
import { encrypt, decrypt } from "@/lib/crypto"
import { revalidatePath } from "next/cache"

export async function addConnection(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('user_connections').insert({
    user_id: user.id,
    display_name: data.display_name,
    website: data.website,
    store_code: data.store_code || null,
    username: data.username,
    password_encrypted: encrypt(data.password)
  })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateConnection(id: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

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

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteConnection(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from('user_connections').delete().eq('id', id).eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getConnectionPassword(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase.from('user_connections').select('password_encrypted').eq('id', id).eq('user_id', user.id).single()

  if (error || !data) throw new Error("Connection not found")
  
  try {
    return decrypt(data.password_encrypted)
  } catch (err) {
    throw new Error("Failed to decrypt password")
  }
}
