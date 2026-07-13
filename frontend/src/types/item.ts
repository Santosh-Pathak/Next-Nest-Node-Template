export type ItemStatus = 'draft' | 'active' | 'archived'

export interface ItemAuthor {
   id?: string
   _id?: string
   name?: string
   email?: string
}

export interface Item {
   id: string
   title: string
   description?: string
   status: ItemStatus
   createdBy?: ItemAuthor | string
   createdAt?: string
   updatedAt?: string
}

export interface CreateItemInput {
   title: string
   description?: string
   status?: ItemStatus
}

export interface UpdateItemInput {
   title?: string
   description?: string
   status?: ItemStatus
}

export const ITEM_STATUS_OPTIONS: {
   value: ItemStatus
   label: string
}[] = [
   { value: 'draft', label: 'Draft' },
   { value: 'active', label: 'Active' },
   { value: 'archived', label: 'Archived' },
]
