'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

import itemsApi from '@/services/apis/items.api'
import type { CreateItemInput, Item, ItemStatus } from '@/types/item'
import { ITEM_STATUS_OPTIONS } from '@/types/item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/theme-utils'

type FormState = CreateItemInput & { id?: string }

const emptyForm: FormState = {
   title: '',
   description: '',
   status: 'draft',
}

function unwrapList(payload: unknown): Item[] {
   if (!payload || typeof payload !== 'object') return []
   const root = payload as Record<string, unknown>
   const data = root.data
   if (Array.isArray(data)) return data as Item[]
   if (data && typeof data === 'object') {
      const nested = data as Record<string, unknown>
      if (Array.isArray(nested.data)) return nested.data as Item[]
   }
   return []
}

export default function ItemsPage() {
   const [items, setItems] = useState<Item[]>([])
   const [loading, setLoading] = useState(true)
   const [saving, setSaving] = useState(false)
   const [form, setForm] = useState<FormState>(emptyForm)
   const [editingId, setEditingId] = useState<string | null>(null)

   const loadItems = useCallback(async () => {
      setLoading(true)
      try {
         const response = await itemsApi.getAll('?limit=50&sort=-createdAt')
         setItems(unwrapList(response))
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to load items'
         toast.error(message)
      } finally {
         setLoading(false)
      }
   }, [])

   useEffect(() => {
      void loadItems()
   }, [loadItems])

   const resetForm = () => {
      setForm(emptyForm)
      setEditingId(null)
   }

   const onSubmit = async (event: React.FormEvent) => {
      event.preventDefault()
      if (!form.title.trim()) {
         toast.error('Title is required')
         return
      }

      setSaving(true)
      try {
         if (editingId) {
            await itemsApi.updateOne(editingId, {
               title: form.title.trim(),
               description: form.description?.trim() || undefined,
               status: form.status,
            })
            toast.success('Item updated')
         } else {
            await itemsApi.create({
               title: form.title.trim(),
               description: form.description?.trim() || undefined,
               status: form.status,
            })
            toast.success('Item created')
         }
         resetForm()
         await loadItems()
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to save item'
         toast.error(message)
      } finally {
         setSaving(false)
      }
   }

   const onEdit = (item: Item) => {
      setEditingId(item.id)
      setForm({
         title: item.title,
         description: item.description || '',
         status: item.status,
      })
   }

   const onDelete = async (id: string) => {
      if (!window.confirm('Delete this item?')) return
      try {
         await itemsApi.deleteOne(id)
         toast.success('Item deleted')
         if (editingId === id) resetForm()
         await loadItems()
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to delete item'
         toast.error(message)
      }
   }

   return (
      <div className="space-y-6">
         <div>
            <h1 className="theme-text-primary text-2xl font-bold">Items</h1>
            <p className="theme-text-secondary mt-1 text-sm">
               Example CRUD module. Copy{' '}
               <code className="theme-bg-secondary rounded px-1">
                  backend/src/modules/items
               </code>{' '}
               and this page when adding a new feature.
            </p>
         </div>

         <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="theme-bg-primary theme-border lg:col-span-2">
               <CardHeader>
                  <CardTitle className="theme-text-primary text-lg">
                     {editingId ? 'Edit item' : 'Create item'}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <form className="space-y-4" onSubmit={onSubmit}>
                     <div className="space-y-2">
                        <label className="theme-text-secondary text-sm">
                           Title
                        </label>
                        <Input
                           value={form.title}
                           onChange={(e) =>
                              setForm((prev) => ({
                                 ...prev,
                                 title: e.target.value,
                              }))
                           }
                           placeholder="Item title"
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="theme-text-secondary text-sm">
                           Description
                        </label>
                        <Input
                           value={form.description}
                           onChange={(e) =>
                              setForm((prev) => ({
                                 ...prev,
                                 description: e.target.value,
                              }))
                           }
                           placeholder="Optional description"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="theme-text-secondary text-sm">
                           Status
                        </label>
                        <Select
                           value={form.status}
                           onValueChange={(value: ItemStatus) =>
                              setForm((prev) => ({ ...prev, status: value }))
                           }
                        >
                           <SelectTrigger>
                              <SelectValue placeholder="Status" />
                           </SelectTrigger>
                           <SelectContent>
                              {ITEM_STATUS_OPTIONS.map((option) => (
                                 <SelectItem
                                    key={option.value}
                                    value={option.value}
                                 >
                                    {option.label}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                           <Plus className="mr-2 h-4 w-4" />
                           {editingId ? 'Update' : 'Create'}
                        </Button>
                        {editingId && (
                           <Button
                              type="button"
                              variant="outline"
                              onClick={resetForm}
                           >
                              Cancel
                           </Button>
                        )}
                     </div>
                  </form>
               </CardContent>
            </Card>

            <Card className="theme-bg-primary theme-border lg:col-span-3">
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="theme-text-primary text-lg">
                     All items
                  </CardTitle>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => void loadItems()}
                     disabled={loading}
                  >
                     <RefreshCw
                        className={cn('h-4 w-4', loading && 'animate-spin')}
                     />
                  </Button>
               </CardHeader>
               <CardContent>
                  {loading ? (
                     <p className="theme-text-muted text-sm">Loading…</p>
                  ) : items.length === 0 ? (
                     <p className="theme-text-muted text-sm">
                        No items yet. Create one on the left.
                     </p>
                  ) : (
                     <ul className="space-y-3">
                        {items.map((item) => (
                           <li
                              key={item.id}
                              className="theme-bg-secondary flex items-start justify-between gap-3 rounded-lg p-3"
                           >
                              <div className="min-w-0 flex-1">
                                 <p className="theme-text-primary font-medium">
                                    {item.title}
                                 </p>
                                 {item.description && (
                                    <p className="theme-text-muted mt-1 text-sm">
                                       {item.description}
                                    </p>
                                 )}
                                 <p className="theme-text-secondary mt-2 text-xs capitalize">
                                    {item.status}
                                 </p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(item)}
                                 >
                                    <Pencil className="h-4 w-4" />
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void onDelete(item.id)}
                                 >
                                    <Trash2 className="text-[var(--error-500)] h-4 w-4" />
                                 </Button>
                              </div>
                           </li>
                        ))}
                     </ul>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   )
}
